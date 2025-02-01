import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  SunIcon,
  MoonIcon,
  DotsHorizontalIcon,
  PlusIcon,
  ViewGridIcon,
  LoginIcon,
  LogoutIcon,
  UserCircleIcon,
  CodeIcon,
  ChipIcon,
  PencilAltIcon,
} from "@heroicons/react/solid";

const Navbar = (props: {
  pattern: string;
  patternBG: () => void;
  menuHandler: () => void;
  fontInitializer: () => void;
  toggleDrawing: () => void;
}) => {
  const { data: session, status } = useSession();
  const { systemTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderThemeChanger = () => {
    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    if (currentTheme === "dark") {
      return (
        <button
          className="flex h-full w-full items-center justify-center text-cyan-300 hover:text-cyan-400 transition-all duration-300"
          role="button"
          onClick={() => setTheme("light")}
        >
          <MoonIcon className="h-6 w-6 transform hover:scale-110" />
        </button>
      );
    } else {
      return (
        <button
          className="flex h-full w-full items-center justify-center text-cyan-500 hover:text-cyan-600 transition-all duration-300"
          role="button"
          onClick={() => setTheme("dark")}
        >
          <SunIcon className="h-6 w-6 transform hover:scale-110" />
        </button>
      );
    }
  };

  const patternSelector = () => {
    if (props.pattern == "cross") {
      return <PlusIcon className="h-5 w-5" />;
    } else if (props.pattern == "dots") {
      return <DotsHorizontalIcon className="h-5 w-5" />;
    } else {
      return <ViewGridIcon className="h-5 w-5" />;
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <nav className="border-b border-cyan-800/30 bg-gray-900/95 backdrop-blur-sm font-general text-gray-100 shadow-lg duration-75">
      <div className="flex flex-row justify-between items-center px-4 py-2">
        <div className="flex flex-row items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-gray-900 rounded-full p-1">
              <ChipIcon className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="relative hidden select-none text-2xl font-extrabold tracking-tight sm:inline lg:text-3xl 2xl:text-4xl">
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              {"CodeSynth"}
            </span>
            <span className="text-sm ml-2 text-cyan-500/70">AI</span>
          </h1>
        </div>

        <div className="flex items-center space-x-1">
          <div className="hidden h-full items-center py-2 px-4 lg:flex">
            <span className="text-cyan-400/90 font-medium">
              {isAuthenticated ? session?.user?.name : "Guest"}
            </span>
            <div className="relative my-auto ml-3 inline h-8 w-8 rounded-full border-2 border-cyan-500/30">
              <UserCircleIcon className="relative h-full w-full rounded-full text-cyan-400" />
            </div>
          </div>

          {process.env.NEXTAUTH_URL && (
            <div className="relative group">
              <button
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                onClick={isAuthenticated ? () => void signOut() : () => void signIn()}
              >
                {isAuthenticated ? <LogoutIcon className="h-5 w-5" /> : <LoginIcon className="h-5 w-5" />}
              </button>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {isAuthenticated ? "Sign Out" : "Sign In"}
              </div>
            </div>
          )}

          {[
            {
              icon: patternSelector(),
              onClick: props.patternBG,
              tooltip: "Change Pattern"
            },
            {
              icon: <CodeIcon className="h-5 w-5" />,
              onClick: props.fontInitializer,
              tooltip: "Change Font"
            },
            {
              icon: <Image
                src="/images/logo.svg"
                className="h-5 w-5"
                height={500}
                width={500}
                alt="AI"
              />,
              onClick: () => {
                props.menuHandler();
              },
              tooltip: "AI Assistant"
            },
            {
              icon: <PencilAltIcon className="h-5 w-5" />,
              onClick: props.toggleDrawing,
              tooltip: "Drawing Canvas"
            }
          ].map((item, index) => (
            <div key={index} className="relative group">
              <button
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                onClick={item.onClick}
              >
                {item.icon}
              </button>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.tooltip}
              </div>
            </div>
          ))}

          <div className="relative group">
            <div className="p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/10 transition-all duration-300">
              {renderThemeChanger()}
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Toggle Theme
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
