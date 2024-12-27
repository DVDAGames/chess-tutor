import { useRef, useEffect } from "react";
import type { Message } from "ai/react";
import { Riple } from "react-loading-indicators";

import MessageBubble from "./message";
import type { GameState } from "../../types";

export interface TutorProps {
  messages: Message[];
  playState: GameState;
  isLoading: boolean;
  commit: () => void;
  undo: () => void;
}

export default function Tutor({ messages, playState, commit, undo, isLoading }: TutorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const onCommit = () => {
    commit();
  };

  const onUndo = () => {
    undo();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen pl-5">
      <header className="flex flex-row items-center">
        <h1>Chess Tutor</h1>
      </header>
      <div ref={scrollRef} className="flex flex-col py-5 mt-2 overflow-y-scroll min-h-[80%] max-h-[80%]">
        <ol>
          {messages
            .filter((message) => message.role === "assistant")
            .map((message, index, array) => (
              <li key={index} className={index !== array.length - 1 ? "mb-5" : ""}>
                <MessageBubble content={message.content as string} />
              </li>
            ))}
        </ol>
      </div>
      <div className="flex flex-row mt-5">
        <button disabled={playState !== "moved"} onClick={onCommit} className="p-2 bg-orange-600 mr-5 h-[40px]">
          Commit
        </button>
        <button disabled={playState !== "moved"} onClick={onUndo} className="p-2 bg-blue-400 h-[40px]">
          Undo
        </button>
        <div className="relative w-[40px] ml-auto">
          <div className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%]">
            {isLoading && (
              <Riple
                size="small"
                color="#31abcc"
                style={{
                  height: "40px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
