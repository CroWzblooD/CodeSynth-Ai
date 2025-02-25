/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { useState, useEffect } from "react";
// import { api } from "~/utils/api";
import { ChatIcon } from "@heroicons/react/solid";
import Navbar from "./components/navbar";
import Chat from "./components/chatgpt";
import Editor from "./components/editor";

const Home: NextPage = () => {
  const [pattern, setPattern] = useState<string>("cross");
  const [translate, setTranslate] = useState<boolean>(false);
  const [font, setFont] = useState<string>("font-general");
  const [mounted, setMounted] = useState<boolean>(false);
  const [showDrawing, setShowDrawing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const patternBG = () => {
    if (pattern === "cross") {
      setPattern("dots");
    } else if (pattern === "dots") {
      setPattern("paper");
    } else {
      setPattern("cross");
    }
  };

  function patternStyles() {
    const defaultPattern =
      "z-5 absolute h-full w-full pattern-gray-400 dark:pattern-gray-600 pattern-bg-gray-300 dark:pattern-bg-gray-800 pattern-opacity-20 duration-150";
    if (pattern === "cross") {
      return defaultPattern + " pattern-cross pattern-size-8";
    } else if (pattern === "dots") {
      return defaultPattern + " pattern-dots pattern-size-6";
    } else {
      return defaultPattern + " pattern-paper pattern-size-6";
    }
  }

  const menuHandler = () => {
    setTranslate(!translate);
  };

  const fontInitializer = () => {
    if (font === "font-general") {
      setFont("font-satoshi");
    } else if (font === "font-satoshi") {
      // setFont("font-azeret");
      setFont("font-clash");
    } else if (font === "font-azeret") {
      setFont("font-clash");
    } else {
      setFont("font-general");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="relative overflow-hidden">
      <div className={font}>
        <Navbar
          pattern={pattern}
          patternBG={patternBG}
          menuHandler={menuHandler}
          fontInitializer={fontInitializer}
          toggleDrawing={() => setShowDrawing(!showDrawing)}
          setShowDrawing={setShowDrawing}
          showDrawing={showDrawing}
        />
        <Chat 
          translate={translate} 
          setTranslate={setTranslate}
          selectedCode=""
          onApplyCode={() => {}}
          selectionRange={null}
          selectedCodeForChat=""
          setSelectedCodeForChat={() => {}}
        />
        <div className="min-h-[calc(100vh-3.6rem)] overflow-hidden bg-gradient-to-b  from-gray-100 to-gray-200 duration-150 dark:from-gray-800 dark:to-gray-900 sm:max-h-[calc(100vh-3.6rem)] ">
          <div className={patternStyles()}></div>
          <Editor showDrawing={showDrawing} setShowDrawing={setShowDrawing} />
        </div>
      </div>
    </main>
  );
};

export default Home;
