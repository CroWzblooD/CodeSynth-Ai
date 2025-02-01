/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-empty-function */
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect, type FormEvent } from "react";
import { 
  UserCircleIcon, 
  TrashIcon, 
  ChipIcon, 
  BeakerIcon, 
  LightningBoltIcon,
  ShieldCheckIcon,
  SwitchHorizontalIcon,
  ChartBarIcon,
  CubeIcon 
} from "@heroicons/react/solid";
import { env } from "../../env.mjs";
import Typewriter from "typewriter-effect";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = env.NEXT_PUBLIC_GEMINI_API_KEY 
  ? new GoogleGenerativeAI(env.NEXT_PUBLIC_GEMINI_API_KEY)
  : null;

export default function Chat(props: { code: string }) {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([] as string[][]);

  //OpenAI integration
  const [submit, setSubmit] = useState(false);

  //request openai from api endpoint
  useEffect(() => {
    async function fetchData() {
      if (submit && message) {
        const context = history.length >= 2
          ? `The context for this conversation is as follows:
             My code: ${props.code}
             My first prompt: ${history.slice(-2)?.[0]?.[1]}
             Your first response: ${history.slice(-2)?.[1]?.[1]}
             My new prompt: ${message}
             Your new response:`
          : `${message}\n My code: ${props.code}`;

        history.push([session?.user?.name || "Guest", message]);

        try {
          // Generate content with Gemini
          const model = genAI?.getGenerativeModel({ model: "gemini-pro" });
          const result = await model?.generateContent(context);
          const response = await result?.response;
          const text = response?.text();


          setHistory([
            ...history,
            ["EditorGPT", text || ""],
          ]);
        } catch (error) {
          console.error("Error generating response:", error);
          setHistory([
            ...history,
            ["EditorGPT", "Sorry, I encountered an error processing your request."],
          ]);
        }
      }
    }
    void fetchData();
    setSubmit(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit]);

  const handleQuery = (text: string) => {
    setQuery(text);
    setMessage(text);
  };

  const setSubmission = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmit(!submit);
    setQuery("");
  };

  const setButtonSubmission = (text: string) => {
    setMessage(text);
    setSubmit(!submit);
    setQuery("");
  };

  return (
    <section className="row-span-3 h-full">
      <div className="relative z-10 flex h-full flex-col justify-between overflow-hidden">
        <div className="relative flex h-full flex-col bg-gray-900/95 backdrop-blur-sm duration-150">
          <div className="relative z-10 flex items-center border-y border-cyan-500/20 bg-gray-900/90 px-4 py-3 duration-150">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative bg-gray-900 rounded-lg p-2">
                  <BeakerIcon className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <p className="flex select-none items-center text-lg font-semibold text-cyan-400/90">
                Code Analysis
              </p>
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <div className="hidden items-center space-x-2 lg:flex">
                {session?.user.image ? (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                    <Image
                      src={session.user.image}
                      alt="avatar"
                      className="relative h-8 w-8 rounded-full"
                      height={500}
                      width={500}
                    />
                  </div>
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-cyan-400" />
                )}
                <span className="text-cyan-400/90">
                  {session ? session.user.name : "Guest"}
                </span>
              </div>
              <button
                className="flex items-center space-x-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-cyan-400 transition-all duration-300 hover:bg-cyan-500/30 hover:text-cyan-300 group"
                onClick={() => setHistory([])}
              >
                <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden font-medium lg:inline">Clear</span>
              </button>
            </div>
          </div>

          <div className="scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/30 flex h-[10rem] grow flex-col-reverse overflow-y-scroll bg-gray-900/50 p-4 pb-1 shadow-inner">
            <div className="relative z-10 flex flex-col">
              {history[0] ? (
                history.map((msg, i) => (
                  <div
                    key={i}
                    className="mb-3 flex flex-col rounded-lg bg-gray-900/90 border border-cyan-500/20 p-4 duration-150 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      {msg[0] === "EditorGPT" ? (
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                          <div className="relative bg-gray-900 rounded-full p-1">
                            <ChipIcon className="h-6 w-6 text-cyan-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                          {msg[0] === "Guest" ? (
                            <UserCircleIcon className="relative h-6 w-6 text-cyan-400" />
                          ) : (
                            <Image
                              src={session?.user.image || ""}
                              alt="avatar"
                              className="relative h-6 w-6 rounded-full"
                              height={500}
                              width={500}
                            />
                          )}
                        </div>
                      )}
                      <p className="font-medium text-cyan-400/90">
                        {msg[0]}:
                      </p>
                    </div>

                    <div className="mt-2 text-sm text-gray-300/90">
                      {msg[0] === "EditorGPT" ? (
                        <Typewriter
                          options={{
                            loop: false,
                            delay: 20,
                            cursor: "",
                            autoStart: true,
                          }}
                          onInit={(typewriter) =>
                            typewriter.typeString(msg[1] || "").start()
                          }
                        />
                      ) : (
                        msg[1]
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid h-full grid-cols-3 gap-3 pb-3">
                  {[
                    { text: "What does my code do?", icon: <CubeIcon className="h-5 w-5" /> },
                    { text: "How can my code be improved?", icon: <LightningBoltIcon className="h-5 w-5" /> },
                    { text: "How efficient is my code?", icon: <BeakerIcon className="h-5 w-5" /> },
                    { text: "Security vulnerabilities?", icon: <ShieldCheckIcon className="h-5 w-5" /> },
                    { text: "Alternative approaches?", icon: <SwitchHorizontalIcon className="h-5 w-5" /> },
                    { text: "Code quality analysis?", icon: <ChartBarIcon className="h-5 w-5" /> }
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setButtonSubmission(item.text)}
                      className="flex flex-col items-center space-y-2 rounded-lg bg-gray-900/70 p-4 text-cyan-400 transition-all duration-300 hover:bg-cyan-500/20 hover:text-cyan-300 group border border-cyan-500/20 hover:border-cyan-500/30"
                    >
                      <div className="group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <span className="text-sm text-center">{item.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 border-t border-cyan-500/20 bg-gray-900/90 p-4">
            <form
              onSubmit={(e) => setSubmission(e)}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Type a message..."
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
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
