/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Editor from "@monaco-editor/react";
import { runInNewContext } from "vm";
import Sk from "skulpt";
import Chat from "./chat";
import ChatGPT from "./chatgpt";
import {
  TrashIcon,
  FolderDownloadIcon,
  PlayIcon,
  TerminalIcon,
  CodeIcon,
  CheckIcon,
  ChatIcon,
  PlusIcon,
} from "@heroicons/react/solid";

export default function CodeEditor() {
  const [value, setValue] = useLocalStorage(
    "CODE",
    "console.log('Hello World')"
  );
  const [logs, setLogs] = useLocalStorage("CONSOLE", []);
  const [language, setLanguage] = useLocalStorage("LANGUAGE", "javascript");
  const [title, setTitle] = useLocalStorage("TITLE", "Untitled Program");
  const [selectedCode, setSelectedCode] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState(false);
  const [selectedCodeForChat, setSelectedCodeForChat] = useState("");

  // Runner function
  function handleRunCode() {
    const sandbox = {
      console: {
        log: (message) => {
          // Convert any type to string for consistent logging
          const formattedMessage = typeof message === 'object' 
            ? JSON.stringify(message)
            : String(message);
          setLogs((prevLogs) => [...prevLogs, formattedMessage]);
        },
      },
    };

    try {
      // Clear previous logs before running new code
      setLogs([]);
      runInNewContext(value, sandbox);
    } catch (error) {
      console.error(error);
      setLogs((prevErrors) => [
        ...prevErrors,
        "R342WT43WTG45Error: " + error.message,
      ]);
    }
  }

  const handleExecutePython = () => {
    // Clear previous logs before running new code
    setLogs([]);
    
    function outf(text) {
      setLogs(prev => [...prev, text]);
    }

    function builtinRead(x) {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
      return Sk.builtinFiles["files"][x];
    }

    Sk.configure({
      output: outf,
      read: builtinRead,
      __future__: Sk.python3
    });

    try {
      Sk.misceval
        .asyncToPromise(() =>
          Sk.importMainWithBody("<stdin>", false, value, true)
        )
        .catch((error) => {
          console.error(error);
          setLogs((prevErrors) => [
            ...prevErrors,
            "R342WT43WTG45Error: " + error.toString(),
          ]);
        });
    } catch (error) {
      console.error(error);
      setLogs((prevErrors) => [
        ...prevErrors,
        "R342WT43WTG45Error: " + error.toString(),
      ]);
    }
  };

  // useEffect(() => {
  //   setValue(
  //     React.Children.map(children, (child) => {
  //       return child.props.children;
  //     }).join("\n")
  //   );
  // }, [children]);

  const handleEditorChange = (value) => {
    setValue(value);
  };

  const handleConsole = (log, index) => {
    const logContent = (log + "").includes("R342WT43WTG45") 
      ? (log + "").replace("R342WT43WTG45", "")
      : log;
    
    const isError = (log + "").includes("R342WT43WTG45");
    
    return (
      <div
        key={index}
        className="relative z-10 last:bg-gpt odd:bg-gray-300 even:bg-gray-200 dark:odd:bg-gray-800 dark:even:bg-[#2a3241]"
      >
        <div
          className={`${
            isError
              ? "grid grid-cols-8 bg-red-400 px-2 text-red-800"
              : "grid grid-cols-8 px-2 text-gptDark dark:text-gptLighter"
          }`}
        >
          <span className="max-w-4 col-span-1 w-4 pr-1 text-gray-500 dark:text-gray-600">
            {index + 1}
          </span>
          <span className="col-span-7">
            {logContent}
          </span>
        </div>
      </div>
    );
  };

  // const runCode = () => {
  //   try {
  //     const fn = new Function(value);
  //     console.log(fn);

  //     const result = fn();
  //     console.log(result);
  //     setOutput(result.toString());
  //   } catch (error) {
  //     console.error(error);
  //     setOutput(error.toString());
  //   }
  // };

  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    let currentDecorations = [];

    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getModel().getValueInRange(e.selection);
      if (selection && selection.trim()) {
        // Only show selection styling if user actively selects code
        if (e.selection.startLineNumber !== e.selection.endLineNumber || 
            e.selection.startColumn !== e.selection.endColumn) {
          
          // Clear any existing decorations
          editor.deltaDecorations(currentDecorations, []);
          
          // Don't add new decoration if code is in chat
          if (selection === selectedCodeForChat) {
            setShowContextMenu(false);
            return;
          }
          
          // Add new decoration
          currentDecorations = editor.deltaDecorations([], [{
            range: e.selection,
            options: {
              className: 'code-selection',
              inlineClassName: 'code-selection-inline',
              minimap: {
                color: '#06b6d4',
                darkColor: '#06b6d4'
              }
            }
          }]);

          const position = { 
            lineNumber: e.selection.startLineNumber, 
            column: e.selection.startColumn 
          };
          const { top, left } = editor.getScrolledVisiblePosition(position);
          const editorContainer = editor.getContainerDomNode();
          const rect = editorContainer.getBoundingClientRect();

          setContextMenuPosition({
            x: rect.left + left + 10,
            y: rect.top + top - 30
          });
          setSelectedCode(selection);
          setSelectionRange({
            startLine: e.selection.startLineNumber,
            endLine: e.selection.endLineNumber
          });
          setShowContextMenu(true);
        }
      } else {
        // Clear decorations when no selection
        editor.deltaDecorations(currentDecorations, []);
        currentDecorations = [];
        setShowContextMenu(false);
        setSelectedCode("");
        setSelectionRange(null);
      }
    });

    // Add click handler for the floating button
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-add-button') && !target.closest('.monaco-editor')) {
        setShowContextMenu(false);
        editor.deltaDecorations(currentDecorations, []);
        currentDecorations = [];
      }
    });
  };

  // Update the style for code selection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .code-selection {
        background-color: rgba(6, 182, 212, 0.2) !important;
      }
      .code-selection-inline {
        background-color: rgba(6, 182, 212, 0.3) !important;
      }
      .code-selection-disabled {
        background-color: rgba(100, 116, 139, 0.2) !important;
      }
      .floating-add-button {
        transition: all 0.2s ease;
      }
      .floating-add-button:hover {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const handleApplyCode = (newCode: string) => {
    if (selectionRange && editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      editor.executeEdits('', [{
        range: new monaco.Range(
          selectionRange.startLine,
          1,
          selectionRange.endLine,
          model.getLineMaxColumn(selectionRange.endLine)
        ),
        text: newCode
      }]);
    }
  };

  const handleAddToChat = () => {
    if (selectedCode) {
      setSelectedCodeForChat(selectedCode);
      // Clear decorations when adding to chat
      if (editorRef.current) {
        editorRef.current.deltaDecorations([], []);
      }
    }
    setTranslate(true);
    setShowContextMenu(false);
  };

  // Add new function to handle chat close
  const handleChatClose = () => {
    setTranslate(false);
    setSelectedCodeForChat("");
    setSelectedCode("");
    if (editorRef.current) {
      editorRef.current.deltaDecorations([], []);
    }
  };

  const codeHandler = () => {
    if (language === "python") {
      return handleExecutePython();
    } else if (language === "javascript") {
      return handleRunCode();
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([value], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = title + ".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleConsoleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob(logs, { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = title + ".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const languageHandler = () => {
    if (language === "python") {
      return (
        <Image
          src="/images/python.png"
          className="rounded-sm "
          height={400}
          width={400}
          alt="python"
        />
      );
    } else if (language === "javascript") {
      return (
        <Image
          src="/images/javascript.png"
          className="rounded-sm "
          height={400}
          width={400}
          alt="js"
        />
      );
    }
  };

  return (
    <section className="grid grid-cols-6">
      <div className="col-span-4 relative">
        <div className="grid grid-cols-5 gap-0">
          <div className="overlay shadow-4xl col-span-3  flex h-full max-h-[calc(100vh-3.6rem)] min-h-[calc(100vh-3.6rem)] w-full flex-col overflow-hidden border-r border-gray-600">
            <div className="flex w-full flex-row items-center border-b border-gray-600 bg-gray-100 py-1 px-2  text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              <CodeIcon className="mr-2 h-5 w-5" />
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                className="rounded-lg border border-gray-300 bg-white px-2 py-0.5 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-gpt dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              ></input>
              <div className="ml-auto flex flex-row items-center">
                <div className="mr-3 flex items-center text-sm italic text-gray-400">
                  <CheckIcon className="mr-1 h-4 w-4 text-cyan-400" /> Saved
                  Locally
                </div>
                <div className="relative inline-block text-gray-600">
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="my-1 appearance-none rounded-lg border border-gray-300 bg-white bg-transparent py-0.5 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-gpt dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ">
                    <div className="mb-0.5 h-[1rem] w-[1rem]">
                      {languageHandler()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={codeHandler}
                  className="m-1 flex items-center justify-center rounded-lg border border-gray-300 bg-white p-1 text-gray-900 duration-150 hover:bg-gray-100 hover:text-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-cyan-500"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
                <button
                  className="my-1 mr-1 flex items-center justify-center rounded-lg border border-gray-300 bg-white p-1 text-gray-900 duration-150 hover:bg-gray-100 hover:text-gpt dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gptDark"
                  onClick={handleDownload}
                >
                  <FolderDownloadIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid h-full grid-rows-6 bg-gray-400 dark:bg-gray-900">
              <div className="row-span-3">
                <Editor
                  className="border-0"
                  theme={"vs-dark"}
                  height={`100%`}
                  width={`100%`}
                  language={language || "javascript"}
                  value={value}
                  defaultValue="// some comment"
                  onMount={handleEditorDidMount}
                  onChange={handleEditorChange}
                  options={{
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: "line",
                    scrollbar: {
                      // Subtle shadows to the left & top. Defaults to true.
                      useShadows: false,
                      // Render vertical arrows. Defaults to false.
                      verticalHasArrows: true,
                      // Render horizontal arrows. Defaults to false.
                      horizontalHasArrows: true,
                      // Render vertical scrollbar.
                      // Accepted values: 'auto', 'visible', 'hidden'.
                      // Defaults to 'auto'
                      vertical: "visible",
                      // Render horizontal scrollbar.
                      // Accepted values: 'auto', 'visible', 'hidden'.
                      // Defaults to 'auto'
                      horizontal: "visible",
                      verticalScrollbarSize: 17,
                      horizontalScrollbarSize: 17,
                      arrowSize: 17,
                    },
                  }}
                />
              </div>
              <Chat code={value} />
            </div>
          </div>
          <div className="col-span-2 flex max-h-[calc(100vh-3.6rem)] min-h-[calc(100vh-3.6rem)] w-full flex-col overflow-hidden bg-gray-900/95 backdrop-blur-sm">
            <div className="flex w-full flex-row items-center border-b border-cyan-500/20 bg-gray-900/90 py-2 px-3 text-cyan-400">
              <div className="flex items-center text-lg font-semibold">
                <TerminalIcon className="mr-2 inline h-6 w-6" /> Console
              </div>
              <button
                className="m-1 ml-auto flex items-center justify-center rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 p-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
                onClick={() => setLogs([])}
              >
                <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </button>
              <button
                className="my-1 mr-1 flex items-center justify-center rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 p-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
                onClick={handleConsoleDownload}
              >
                <FolderDownloadIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
            <div className="scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/30 h-full w-full overflow-x-hidden overflow-y-scroll text-cyan-300">
              <div className="relative z-10 m-3 rounded-lg border border-cyan-500/20 bg-gray-900/90 font-mono">
                <div className="overflow-hidden rounded-lg">
                  {logs[0] ? (
                    logs.map((log, index) => handleConsole(log, index))
                  ) : (
                    <div className="relative z-10 rounded-lg bg-gray-900/50">
                      <div className="grid grid-cols-8 px-2 py-2">
                        <span className="max-w-4 col-span-1 w-4 pr-1 text-gray-500">
                          1
                        </span>
                        <span className="col-span-7 text-gray-500">
                          Run to see output
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Improved floating button */}
        {showContextMenu && (
          <div 
            className="fixed z-50 floating-add-button flex items-center gap-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-cyan-400 hover:text-cyan-300 shadow-lg cursor-pointer transition-all duration-300 border border-cyan-500/20 hover:border-cyan-500/30"
            style={{ 
              left: contextMenuPosition.x, 
              top: contextMenuPosition.y 
            }}
            onClick={handleAddToChat}
          >
            <PlusIcon className="h-4 w-4" />
            <ChatIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Analyze Code</span>
          </div>
        )}
      </div>
      
      <div className={`col-span-2 ${translate ? 'block' : 'hidden'}`}>
        <ChatGPT
          translate={translate}
          setTranslate={setTranslate}
          selectedCode={selectedCode}
          onApplyCode={handleApplyCode}
          selectionRange={selectionRange}
          selectedCodeForChat={selectedCodeForChat}
          setSelectedCodeForChat={setSelectedCodeForChat}
          onClose={handleChatClose}
        />
      </div>
    </section>
  );
}

function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}