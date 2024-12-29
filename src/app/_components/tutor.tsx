import { useRef, useEffect } from "react";
import type { Message } from "ai/react";
import { Riple } from "react-loading-indicators";
import type { Color } from "chess.js";

import MessageBubble from "./message";
import Evaluation from "./evaluation";
import type { GameState } from "../../types";

export interface TutorProps {
  messages: Message[];
  playState: GameState;
  isLoading: boolean;
  position: string;
  turn: Color;
  commit: () => void;
  undo: () => void;
  analyze: () => void;
  stop: () => void;
}

export default function Tutor({ messages, stop, commit, undo, turn, analyze, isLoading, position }: TutorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div ref={scrollRef} className="flex flex-col py-5 mt-2 overflow-y-scroll min-h-[65%] max-h-[65%]">
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
      <div className="flex flex-col">
        <Evaluation position={position} width={scrollRef.current?.clientWidth} />
        <div className="flex flex-row mt-5">
          <button onClick={isLoading ? stop : analyze} className="p-2 bg-blue-400 mr-5 h-[40px]">
            {isLoading ? "Stop" : "Analyze"}
          </button>
          <button
            disabled={turn === "w"}
            onClick={undo}
            className={`p-2 ${turn === "w" ? `bg-slate-600` : `bg-blue-400`} mr-5 h-[40px]`}
          >
            Undo
          </button>
          <button
            disabled={turn === "w"}
            onClick={commit}
            className={`p-2 ${turn === "w" ? `bg-slate-600` : `bg-orange-600`} h-[40px]`}
          >
            Commit
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
    </div>
  );
}
