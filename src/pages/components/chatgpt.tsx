/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect, type FormEvent } from "react";
// import { api } from "~/utils/api";
import { UserCircleIcon, TrashIcon, CheckIcon, ChipIcon, SparklesIcon } from "@heroicons/react/solid";
import { env } from "../../env.mjs";
import Typewriter from "typewriter-effect";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { XIcon } from "@heroicons/react/solid";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(env.NEXT_PUBLIC_GEMINI_API_KEY);

// type Roles = "user" | "assistant" | "system";
interface ChatGPTProps {
  translate: boolean;
  setTranslate: (value: boolean) => void;
  selectedCode: string;
  onApplyCode: (code: string) => void;
  selectionRange: any;
  selectedCodeForChat: string;
  setSelectedCodeForChat: (code: string) => void;
  onClose?: () => void;  // Make onClose optional
}

export default function ChatGPT({ 
  setTranslate, 
  translate,
  selectedCode,
  onApplyCode,
  selectionRange,
  selectedCodeForChat,
  setSelectedCodeForChat,
  onClose
}: ChatGPTProps) {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([] as Array<{
    role: string;
    content: string;
    code?: string;
    isCodeSuggestion?: boolean;
    selectedCode?: string;
  }>);

  //OpenAI integration
  // const [roles, setRoles] = useState<Roles>("user");
  const [submit, setSubmit] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  //request openai from api endpoint
  useEffect(() => {
    async function fetchData() {
      if (submit && message) {
        const userPrompt = selectedCode 
          ? `Fix or improve this code:\n\`\`\`\n${selectedCode}\n\`\`\`\n\nMy request: ${message}\n\nPlease provide:\n1. A clear explanation of the issues/improvements\n2. The complete corrected code in a code block\n3. Any additional best practices or suggestions`
          : message;

        setHistory(prev => [...prev, {
          role: "user",
          content: message,
          selectedCode: selectedCode
        }]);

        try {
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }]}],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          });

          const response = result.response.text();
          
          // Extract code blocks
          const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
          const matches = [...(response?.matchAll(codeBlockRegex) ?? [])];
          const code = matches.length > 0 ? matches[0][1].trim() : undefined;

          // Clean response and format it better
          let cleanResponse = response;
          if (matches.length > 0) {
            cleanResponse = response
              .replace(codeBlockRegex, '')
              .trim()
              .split('\n')
              .filter(line => line.trim())
              .join('\n');
          }

          setHistory(prev => [...prev, {
            role: "assistant",
            content: cleanResponse,
            code: code,
            isCodeSuggestion: !!code
          }]);
        } catch (error) {
          console.error("Error:", error);
          setHistory(prev => [...prev, {
            role: "assistant",
            content: "Sorry, I encountered an error processing your request."
          }]);
        }
      }
    }
    void fetchData();
    setSubmit(false);
  }, [submit]);

  // Handle selected code when it changes
  useEffect(() => {
    if (selectedCodeForChat) {
      setHistory(prev => [...prev, {
        role: "user",
        content: "Please analyze this code:",
        selectedCode: selectedCodeForChat
      }]);
      
      // Clear the selected code after adding to chat
      setSelectedCodeForChat && setSelectedCodeForChat(null);
    }
  }, [selectedCodeForChat]);

  const handleQuery = (value: string) => {
    setQuery(value);
  };

  const setSubmission = (e: FormEvent) => {
    e.preventDefault();
    setMessage(query);
    setQuery("");
    setSubmit(true);
  };

  const renderMessage = (msg: { 
    role: string; 
    content: string; 
    code?: string;
    isCodeSuggestion?: boolean;
    selectedCode?: string;
  }, index: number) => {
    return (
      <div key={index} className="mb-4 rounded-lg bg-gray-900/50 backdrop-blur-sm p-4 shadow-lg border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300">
        <div className="flex items-center gap-3">
          {msg.role === "user" ? (
            session?.user?.image ? (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <Image
                  src={session.user.image}
                  alt="User"
                  className="relative h-8 w-8 rounded-full"
                  width={32}
                  height={32}
                />
              </div>
            ) : (
              <UserCircleIcon className="h-8 w-8 text-cyan-400" />
            )
          ) : (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-gray-900 rounded-full p-1">
                <ChipIcon className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          )}
          <span className="font-medium text-cyan-400/90">
            {msg.role === "user" ? session?.user?.name || "You" : "CodeSynth AI"}
          </span>
        </div>

        {msg.selectedCode && (
          <div className="mt-3 rounded-md bg-gray-950/50 p-3 border border-cyan-500/20">
            <pre className="text-sm overflow-x-auto">
              <code className="text-cyan-300/90">
                {msg.selectedCode}
              </code>
            </pre>
          </div>
        )}
        
        <div className="mt-3 whitespace-pre-wrap text-sm text-gray-300/90">
          {msg.role === "assistant" ? (
            <Typewriter
              options={{
                delay: 20,
                cursor: "",
                loop: false,
              }}
              onInit={(typewriter) => {
                typewriter.typeString(msg.content).start();
              }}
            />
          ) : (
            msg.content
          )}
        </div>

        {msg.code && (
          <div className="mt-3">
            <div className="rounded-md bg-gray-950/50 p-3 border border-cyan-500/20">
              <pre className="text-sm">
                <code className="text-cyan-300/90">{msg.code}</code>
              </pre>
            </div>
            <button
              onClick={() => onApplyCode && onApplyCode(msg.code!)}
              className="mt-2 flex items-center gap-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
            >
              <SparklesIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              Apply Changes
            </button>
          </div>
        )}
      </div>
    );
  };

  const showChat = () => {
    if (translate) {
      return "absolute bottom-4 right-4 flex w-72 flex-col translate-x-0 duration-150 z-20";
    } else {
      return "absolute bottom-4 right-4 flex w-72 flex-col translate-x-[110%] duration-150 z-20";
    }
  };

  // Update the close handler to check if onClose exists
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setTranslate(false);  // Fallback to using setTranslate if onClose isn't provided
    }
  };

  if (!mounted) {
    return null; // Return null on server-side and first render
  }

  return (
    <section
      className={`fixed right-0 top-14 z-10 h-[calc(100vh-3.6rem)] w-[30rem] transform overflow-hidden bg-gray-900/95 backdrop-blur-sm shadow-2xl duration-300 border-l border-cyan-500/20 ${
        translate ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Add close button at the top */}
        <div className="flex justify-end p-2 border-b border-cyan-500/20">
          <button 
            onClick={handleClose}
            className="flex items-center justify-center rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 p-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
          >
            <XIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/30">
          {history.map((msg, i) => renderMessage(msg, i))}
        </div>
        
        <form onSubmit={setSubmission} className="border-t border-cyan-500/20 p-4 bg-gray-950/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={selectedCode ? "Ask about the selected code..." : "Type a message..."}
              className="w-full rounded-lg border border-cyan-500/20 bg-gray-900/50 py-2 px-4 text-gray-300 placeholder-gray-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all duration-300"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 p-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
            >
              <ChipIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
