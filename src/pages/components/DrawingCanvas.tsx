import React, { useRef, useEffect, useState } from 'react';
import { UploadIcon, XIcon } from '@heroicons/react/solid';

interface DrawingCanvasProps {
  isVisible: boolean;
  pattern?: string;
}

interface ImageState {
  element: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
}

// Add new interface for text
interface TextState {
  content: string;
  x: number;
  y: number;
  isEditing: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
}

export default function DrawingCanvas({ isVisible, pattern = 'cross' }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [currentImage, setCurrentImage] = useState<ImageState | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<ImageData | null>(null);
  const [texts, setTexts] = useState<TextState[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [activeElement, setActiveElement] = useState<'drawing' | 'text' | 'image' | null>(null);

  // Modified canvas initialization
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      setContext(ctx);
    }

    // Handle resize
    const handleResize = () => {
      const prevDrawings = drawings;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (ctx) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
        
        // Restore previous state
        if (prevDrawings) {
          ctx.putImageData(prevDrawings, 0, 0);
        }
        if (currentImage) {
          ctx.drawImage(
            currentImage.element,
            currentImage.x,
            currentImage.y,
            currentImage.width,
            currentImage.height
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentImage?.isSelected) {
          // Remove the image but keep drawings
          setCurrentImage(null);
          redrawCanvas();
        }
        // Remove any selected text
        const selectedTextIndex = texts.findIndex(text => text.isSelected);
        if (selectedTextIndex !== -1) {
          const newTexts = texts.filter((_, index) => index !== selectedTextIndex);
          setTexts(newTexts);
          redrawCanvas();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImage, texts]);

  const redrawCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    // Clear the canvas
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw in correct order: drawings -> image -> text
    if (drawings) {
      context.putImageData(drawings, 0, 0);
    }
    
    if (currentImage) {
      context.drawImage(
        currentImage.element,
        currentImage.x,
        currentImage.y,
        currentImage.width,
        currentImage.height
      );

      if (currentImage.isSelected) {
        drawSelectionHandles(currentImage);
      }
    }

    // Draw non-editing texts
    context.font = '20px Arial';
    context.fillStyle = '#06b6d4';
    texts.forEach(text => {
      if (!text.isEditing && !text.isDragging) {
        context.fillText(text.content, text.x, text.y);
      }
    });
  };

  const drawSelectionHandles = (image: ImageState) => {
    if (!context) return;

    // Draw border
    context.strokeStyle = '#06b6d4';
    context.lineWidth = 2;
    context.strokeRect(image.x, image.y, image.width, image.height);

    // Draw handles
    const handles = [
      { x: image.x, y: image.y, cursor: 'nw' },
      { x: image.x + image.width, y: image.y, cursor: 'ne' },
      { x: image.x + image.width, y: image.y + image.height, cursor: 'se' },
      { x: image.x, y: image.y + image.height, cursor: 'sw' }
    ];

    handles.forEach(handle => {
      context.beginPath();
      context.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
      context.fillStyle = '#06b6d4';
      context.fill();
      context.stroke();
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current || !context) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = canvasRef.current!;
        
        // Calculate image dimensions
        const scale = Math.min(
          (canvas.width * 0.8) / img.width,
          (canvas.height * 0.8) / img.height
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
        const newX = (canvas.width - newWidth) / 2;
        const newY = (canvas.height - newHeight) / 2;

        // Create new image state
        const newImage: ImageState = {
          element: img,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          isSelected: false,
          isDragging: false,
          dragStartX: 0,
          dragStartY: 0
        };

        setCurrentImage(newImage);
        // Immediately draw the image
        context.drawImage(img, newX, newY, newWidth, newHeight);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startInteraction = (e: React.MouseEvent) => {
    if (!canvasRef.current || !context) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Deselect all texts first
    const updatedTexts = texts.map(text => ({ ...text, isSelected: false }));
    setTexts(updatedTexts);

    // Check if clicking on image
    if (currentImage) {
      const isInsideImage = 
        x >= currentImage.x && 
        x <= currentImage.x + currentImage.width &&
        y >= currentImage.y && 
        y <= currentImage.y + currentImage.height;

      if (isInsideImage) {
        setActiveElement('image');
        handleImageInteraction(x, y);
        return;
      }
    }

    // If not interacting with image or text, start drawing
    setActiveElement('drawing');
    setIsDrawing(true);
    setLastPosition({ x, y });
  };

  const handleImageInteraction = (x: number, y: number) => {
    if (!currentImage) return;

    if (currentImage.isSelected) {
      const handleSize = 6;
      const handles = [
        { x: currentImage.x, y: currentImage.y, cursor: 'nw' },
        { x: currentImage.x + currentImage.width, y: currentImage.y, cursor: 'ne' },
        { x: currentImage.x + currentImage.width, y: currentImage.y + currentImage.height, cursor: 'se' },
        { x: currentImage.x, y: currentImage.y + currentImage.height, cursor: 'sw' }
      ];

      const clickedHandle = handles.find(handle => 
        Math.abs(x - handle.x) < handleSize * 2 && 
        Math.abs(y - handle.y) < handleSize * 2
      );

      if (clickedHandle) {
        setActiveHandle(clickedHandle.cursor);
      } else {
        setCurrentImage({
          ...currentImage,
          isDragging: true,
          dragStartX: x - currentImage.x,
          dragStartY: y - currentImage.y
        });
      }
    } else {
      setCurrentImage({
        ...currentImage,
        isSelected: true
      });
    }
  };

  const handleInteraction = (e: React.MouseEvent) => {
    if (!canvasRef.current || !context) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentImage?.isDragging) {
      const newX = x - currentImage.dragStartX;
      const newY = y - currentImage.dragStartY;
      
      setCurrentImage({
        ...currentImage,
        x: newX,
        y: newY
      });
      redrawCanvas();
    } else if (activeHandle && currentImage) {
      // Handle resizing
      const newImage = { ...currentImage };
      
      switch (activeHandle) {
        case 'nw':
          newImage.width += newImage.x - x;
          newImage.height += newImage.y - y;
          newImage.x = x;
          newImage.y = y;
          break;
        case 'ne':
          newImage.width = x - newImage.x;
          newImage.height += newImage.y - y;
          newImage.y = y;
          break;
        case 'se':
          newImage.width = x - newImage.x;
          newImage.height = y - newImage.y;
          break;
        case 'sw':
          newImage.width += newImage.x - x;
          newImage.height = y - newImage.y;
          newImage.x = x;
          break;
      }

      setCurrentImage(newImage);
      redrawCanvas();
    } else if (isDrawing) {
      context.beginPath();
      context.moveTo(lastPosition.x, lastPosition.y);
      context.lineTo(x, y);
      context.stroke();
      setLastPosition({ x, y });
      
      // Save drawing state
      if (!currentImage?.isDragging && !activeHandle) {
        setDrawings(context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
      }
    }
  };

  const stopInteraction = () => {
    if (isDrawing) {
      const imageData = context?.getImageData(
        0, 
        0, 
        canvasRef.current!.width, 
        canvasRef.current!.height
      );
      if (imageData) {
        setDrawings(imageData);
      }
    }
    
    setActiveHandle(null);
    setIsDrawing(false);
    setActiveElement(null);
    
    if (currentImage) {
      setCurrentImage({
        ...currentImage,
        isDragging: false
      });
    }

    // Stop text dragging
    const updatedTexts = texts.map(text => ({
      ...text,
      isDragging: false
    }));
    setTexts(updatedTexts);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCurrentImage(null);
    setDrawings(null);
    setTexts([]);
  };

  const patternStyles = () => {
    const defaultPattern = "absolute inset-0 z-0 pattern-gray-400 dark:pattern-gray-600 pattern-bg-gray-300 dark:pattern-bg-gray-800 pattern-opacity-20";
    if (pattern === "cross") {
      return `${defaultPattern} pattern-cross pattern-size-8`;
    } else if (pattern === "dots") {
      return `${defaultPattern} pattern-dots pattern-size-6`;
    } else {
      return `${defaultPattern} pattern-paper pattern-size-6`;
    }
  };

  // Simplified text handlers
  const handleAddText = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const newText: TextState = {
      content: 'Double click to edit',
      x: canvas.width / 2,
      y: canvas.height / 2,
      isEditing: true,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };
    setTexts([...texts, newText]);
  };

  const handleTextDragStart = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = texts[index];
    if (text.isEditing) return;

    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...text,
      isDragging: true,
      dragStartX: e.clientX - text.x,
      dragStartY: e.clientY - text.y
    };
    setTexts(updatedTexts);
  };

  const handleTextDrag = (index: number, e: React.MouseEvent) => {
    const text = texts[index];
    if (!text.isDragging) return;

    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...text,
      x: e.clientX - text.dragStartX,
      y: e.clientY - text.dragStartY
    };
    setTexts(updatedTexts);
  };

  const handleTextDragEnd = (index: number) => {
    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...texts[index],
      isDragging: false
    };
    setTexts(updatedTexts);
  };

  const handleTextDoubleClick = (index: number) => {
    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...texts[index],
      isEditing: true
    };
    setTexts(updatedTexts);
  };

  const handleTextChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...texts[index],
      content: e.target.value
    };
    setTexts(updatedTexts);
  };

  const handleTextBlur = (index: number) => {
    const updatedTexts = [...texts];
    updatedTexts[index] = {
      ...texts[index],
      isEditing: false
    };
    setTexts(updatedTexts);
  };

  if (!isVisible) return null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm">
        <div className={patternStyles()} />
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm"
        >
          <UploadIcon className="h-5 w-5" />
          Upload Image
        </button>
        <button
          onClick={handleAddText}
          className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 backdrop-blur-sm"
        >
          Add Text
        </button>
        <button
          onClick={clearCanvas}
          className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 backdrop-blur-sm"
        >
          Clear Canvas
        </button>
      </div>

      <div className="absolute inset-0 z-40">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ 
            cursor: activeHandle 
              ? `${activeHandle}-resize` 
              : activeElement === 'image' && currentImage?.isDragging 
                ? 'move' 
                : activeElement === 'drawing'
                  ? 'crosshair'
                  : 'default'
          }}
          onMouseDown={startInteraction}
          onMouseMove={handleInteraction}
          onMouseUp={stopInteraction}
          onMouseOut={stopInteraction}
        />
        {texts.map((text, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: text.x + 'px',
              top: text.y + 'px',
              cursor: text.isEditing ? 'text' : 'move',
              zIndex: 50
            }}
            onMouseDown={(e) => handleTextDragStart(index, e)}
            onMouseMove={(e) => handleTextDrag(index, e)}
            onMouseUp={() => handleTextDragEnd(index)}
            onDoubleClick={() => handleTextDoubleClick(index)}
          >
            {text.isEditing ? (
              <input
                type="text"
                value={text.content}
                onChange={(e) => handleTextChange(index, e)}
                onBlur={() => handleTextBlur(index)}
                style={{
                  background: 'transparent',
                  color: '#06b6d4',
                  border: '1px solid #06b6d4',
                  outline: 'none',
                  font: '20px Arial',
                  padding: '2px 4px',
                  minWidth: '100px'
                }}
                autoFocus
              />
            ) : (
              <span
                style={{
                  color: '#06b6d4',
                  font: '20px Arial',
                  padding: '2px 4px',
                  userSelect: 'none'
                }}
              >
                {text.content}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 