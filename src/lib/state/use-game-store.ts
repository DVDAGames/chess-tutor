import { create } from "zustand";
import { Chess } from "chess.js";
import type { GameState } from "../../types";

export type GameStoreState = {
  game: Chess;
  position: string;
  evaluation: number[];
  round: number;
  playState: GameState;
  gameOver: boolean;
  gameOverState: string;
  autogenerateCommentary: boolean;
};

export type GameStoreActions = {
  newGame: () => void;
  setGame: (game: Chess) => void;
  undoMove: () => void;
  setEvaluation: (evaluation: number[]) => void;
  addEvaluation: (evaluation: number) => void;
  incrementRound: () => void;
  setPlayState: (state: GameState) => void;
  setGameOver: (isOver: boolean) => void;
  setGameOverState: (state: string) => void;
  toggleAutogenerateCommentary: () => void;
  setAutogenerateCommentary: (autogenerateCommentary: boolean) => void;
};

export type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  game: new Chess(),
  evaluation: [0.0],
  round: 1,
  position: "",
  playState: "choosing",
  gameOver: false,
  gameOverState: "",
  autogenerateCommentary: false,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  newGame: () =>
    set((state) => {
      const date = new Date();

      const { evaluation, playState, gameOver, gameOverState } = initialState;

      const game = new Chess();

      const round = state.round + 1;

      // borrowed from: https://blog.mathieuacher.com/GPTsChessEloRatingLegalMoves/
      game.header(
        "Event",
        `Chess Tutoring ${date.getFullYear()}`,
        "Site",
        navigator.userAgent,
        "Date",
        `${date.getFullYear()}.${date.getMonth() + 1 < 10 ? `0` : ``}${date.getMonth() + 1}.${
          date.getDate() < 10 ? `0` : ``
        }${date.getDate()}`,
        "Round",
        `${round}`,
        "White",
        "Chess Student",
        "Black",
        "kaspar0v",
        "WhiteElo",
        "500",
        "BlackElo",
        "2750",
        "BlackTitle",
        "GM",
        "Variant",
        "Standard"
      );

      return {
        evaluation,
        playState,
        gameOver,
        gameOverState,
        game,
        round,
      };
    }),
  setGame: (game) => set({ game }),
  undoMove: () =>
    set((state) => {
      const { game } = state;

      const { playState, gameOver, gameOverState } = initialState;

      game.undo();

      const evaluation = [...state.evaluation];

      evaluation.pop();

      if (evaluation.length === 0) {
        evaluation.push(0.0);
      }

      console.log("EVAL: ", evaluation);

      return { game, playState, gameOver, gameOverState, evaluation };
    }),
  setEvaluation: (evaluation) => set({ evaluation }),
  addEvaluation: (e) =>
    set((state) => {
      const { evaluation } = state;

      evaluation.push(e);

      return { evaluation };
    }),
  incrementRound: () => set((state) => ({ round: state.round + 1 })),
  setPlayState: (playState) => set({ playState }),
  setGameOver: (gameOver) => set({ gameOver }),
  setGameOverState: (gameOverState) => set({ gameOverState }),
  toggleAutogenerateCommentary: () => set((state) => ({ autogenerateCommentary: !state.autogenerateCommentary })),
  setAutogenerateCommentary: (autogenerateCommentary) => set({ autogenerateCommentary }),
}));
