import { useRef, useEffect } from "react";
import type { Message } from "ai/react";
import { Riple } from "react-loading-indicators";
import type { Color } from "chess.js";

import MessageBubble from "./message";
import Evaluation from "./evaluation";
import { useGameStore } from "../../lib/state/use-game-store";
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

export default function Tutor({ messages, stop, commit, undo, turn, analyze, isLoading }: TutorProps) {
  const { game, gameOver, evaluation, autogenerateCommentary, toggleAutogenerateCommentary } = useGameStore();

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
      <div ref={scrollRef} className="flex flex-col py-5 mt-2 overflow-y-scroll min-h-[60%] max-h-[60%]">
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
        <Evaluation evaluation={evaluation} position={game.fen()} width={scrollRef.current?.clientWidth} />
        <div className="flex flex-row mt-5">
          <button
            disabled={gameOver || turn === "w"}
            onClick={commit}
            className={`p-2 ${turn === "w" ? `bg-slate-600` : `bg-orange-600`} h-[40px] mr-5`}
          >
            Commit
          </button>
          <button
            disabled={gameOver || turn === "w"}
            onClick={undo}
            className={`p-2 ${turn === "w" ? `bg-slate-600` : `bg-blue-400`} mr-5 h-[40px]`}
          >
            Undo
          </button>
          <button
            disabled={gameOver || (autogenerateCommentary && !isLoading)}
            onClick={isLoading ? stop : analyze}
            className={`flex items-center justify-center align-middle p-2 ${
              autogenerateCommentary && !isLoading ? `bg-slate-600` : isLoading ? `bg-orange-600` : `bg-blue-400`
            } h-[40px]`}
            title={isLoading ? "Stop generating text" : "Get analysis"}
          >
            {isLoading ? "Stop" : "Talk"}
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
        <div className="flex flex-row mt-5">
          <input
            type="checkbox"
            id="autogenerate"
            name="autogenerate"
            onChange={toggleAutogenerateCommentary}
            checked={autogenerateCommentary}
          />
          <label htmlFor="autogenerate" className="ml-2">
            Automatic Commentary
          </label>
        </div>
      </div>
    </div>
  );
}
