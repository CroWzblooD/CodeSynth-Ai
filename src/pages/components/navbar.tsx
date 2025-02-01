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
  XIcon,
} from "@heroicons/react/solid";

interface NavbarProps {
  pattern: string;
  patternBG: () => void;
  menuHandler: () => void;
  fontInitializer: () => void;
  toggleDrawing: () => void;
}

export default function Navbar({ pattern, patternBG, menuHandler, fontInitializer, toggleDrawing }: NavbarProps) {
  const { data: session } = useSession();
  const { systemTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderThemeChanger = () => {
    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    if (currentTheme === "dark") {
      return (
        <SunIcon 
          className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all duration-300" 
          onClick={() => setTheme("light")}
        />
      );
    } else {
      return (
        <MoonIcon 
          className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all duration-300" 
          onClick={() => setTheme("dark")}
        />
      );
    }
  };

  const handleDrawingClick = () => {
    console.log("Drawing button clicked in navbar"); // Debug log
    toggleDrawing();
  };

  const navButtons = [
    {
      icon: session ? (
        <LogoutIcon className="h-5 w-5" />
      ) : (
        <LoginIcon className="h-5 w-5" />
      ),
      onClick: session ? () => void signOut() : () => void signIn(),
      tooltip: session ? "Sign Out" : "Sign In",
    },
    {
      icon: pattern === "cross" ? (
        <PlusIcon className="h-5 w-5" />
      ) : pattern === "dots" ? (
        <DotsHorizontalIcon className="h-5 w-5" />
      ) : (
        <ViewGridIcon className="h-5 w-5" />
      ),
      onClick: patternBG,
      tooltip: "Change Pattern",
    },
    {
      icon: <CodeIcon className="h-5 w-5" />,
      onClick: fontInitializer,
      tooltip: "Change Font",
    },
    {
      icon: <ChipIcon className="h-5 w-5" />,
      onClick: menuHandler,
      tooltip: "AI Assistant",
    },
    {
      icon: <PencilAltIcon className="h-5 w-5" />,
      onClick: handleDrawingClick,
      tooltip: "Drawing Canvas",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-800/30 bg-gray-900/95 backdrop-blur-sm font-general text-gray-100 shadow-lg duration-75">
      <div className="mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-gray-900 rounded-full p-1">
              <ChipIcon className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="relative hidden select-none text-2xl font-extrabold tracking-tight sm:inline lg:text-3xl 2xl:text-4xl">
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              CodeSynth
            </span>
            <span className="text-sm ml-2 text-cyan-500/70">AI</span>
          </h1>
        </div>

        {/* User Profile and Actions */}
        <div className="flex items-center space-x-2">
          {/* User Profile */}
          <div className="hidden h-full items-center py-2 px-4 lg:flex">
            <span className="text-cyan-400/90 font-medium">
              {session?.user?.name || "Guest"}
            </span>
            <div className="relative my-auto ml-3 inline h-8 w-8 rounded-full border-2 border-cyan-500/30 group hover:border-cyan-400 transition-all duration-300">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  className="relative h-full w-full rounded-full"
                  height={500}
                  width={500}
                />
              ) : (
                <UserCircleIcon className="relative h-full w-full rounded-full text-cyan-400" />
              )}
              <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-gray-900 bg-cyan-400 group-hover:bg-cyan-300 transition-all duration-300"></div>
            </div>
          </div>

          {/* Action Buttons */}
          {navButtons.map((button, index) => (
            <div key={index} className="relative group">
              <button
                onClick={button.onClick}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group"
              >
                {button.icon}
              </button>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {button.tooltip}
              </div>
            </div>
          ))}

          {/* Theme Toggle */}
          <div className="relative group">
            <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/10 transition-all duration-300 group">
              {renderThemeChanger()}
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Toggle Theme
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}