"use client";

import { useEffect, useState, useRef } from "react";

import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { LinePlot } from "@mui/x-charts/LineChart";

import Engine from "../../lib/engine";
import { useGameStore } from "../../lib/state/use-game-store";

export interface EvaluationProps {
  position: string;
  width?: number;
  evaluation: number[];
}

const positionRegex = /Total evaluation\: (\-?\d+.?\d+) \([\w\s]+\)/;

export default function Evaluation({ position, width, evaluation }: EvaluationProps) {
  const { addEvaluation, game } = useGameStore();
  const [engine, setEngine] = useState<Engine>();
  const stockfish = useRef<Worker>(null);

  useEffect(() => {
    /*!
     * Stockfish.js (http://github.com/nmrugg/stockfish.js)
     * License: GPL
     */
    // HACK: downloaded directly from the react-chessboard demo because I can't get it to compile
    // https://github.com/Clariity/react-chessboard/tree/main/stories/stockfish
    stockfish.current = new Worker("/engine/stockfish.wasm.js");

    if (stockfish.current !== null) {
      const newEngine = new Engine(stockfish.current);

      newEngine.onReady(() => {
        setEngine(newEngine);
      });

      newEngine.onMessage(({ uciMessage }) => {
        if (positionRegex.test(uciMessage)) {
          const data = positionRegex.exec(uciMessage);

          if (data !== null) {
            const engineEvaluation = data[1];

            addEvaluation(Number(engineEvaluation));
          }
        }
      });
    }

    return () => {
      if (stockfish.current !== null) {
        stockfish.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof engine !== "undefined") {
      engine.stop();

      if (game.history().length > 0) {
        engine.evaluatePosition(position);
      }
    }
  }, [position]);

  return (
    <div className="flex flex-col">
      <p>Engine Evaluation: {evaluation.at(-1)}</p>
      <div className="bg-slate-400 w-full">
        <ChartContainer
          series={[
            {
              type: "line",
              data: evaluation,
              area: true,
              baseline: 0,
            },
          ]}
          width={width ?? 200}
          height={width ? width * 0.475 : 150}
          xAxis={[
            {
              data:
                evaluation.length > 20 ? evaluation.map((_, index) => index) : Array.from({ length: 50 }, (_, index) => index),
            },
          ]}
          yAxis={[
            {
              min: Math.min(Math.min(...evaluation), -1) - 1,
              max: Math.max(Math.max(...evaluation), 1) + 1,
              colorMap: {
                type: "piecewise",
                thresholds: [0],
                colors: ["black", "white"],
              },
              domainLimit: "nice",
            },
          ]}
        >
          <LinePlot />
        </ChartContainer>
      </div>
    </div>
  );
}
