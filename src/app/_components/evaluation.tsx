"use client";

import { useEffect, useState, useRef } from "react";
import Engine from "../../lib/engine";

export interface EvaluationProps {
  position: string;
}

export default function Evaluation({ position }: EvaluationProps) {
  const [engine, setEngine] = useState<Engine>(null);
  const stockfish = useRef<Worker>(null);

  useEffect(() => {
    stockfish.current = new Worker("./stockfish.wasm.js");

    if (stockfish.current !== null) {
      const newEngine = new Engine(stockfish.current);

      newEngine.onReady(() => {
        setEngine(newEngine);
      });
    }

    return () => {
      if (stockfish.current !== null) {
        stockfish.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (engine !== null) {
      const evaluation = engine.evaluatePosition(position);
      console.log(evaluation);
    }
  }, [position]);

  return (
    <div>
      <h1>Engine Evaluation</h1>
    </div>
  );
}
