"use client";

import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useChat } from "ai/react";
import { Mosaic } from "react-loading-indicators";
import type { CustomSquareStyles, Piece, Square } from "react-chessboard/dist/chessboard/types";

import Tutor from "./tutor";
import type { GameState } from "../../types";

const chess = new Chess();

const date = new Date();

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  const { messages, append, stop, isLoading, setMessages } = useChat({
    api: "/api/bot/chat",
    initialMessages: [
      {
        id: "tutor-welcome",
        role: "assistant",
        content: `Let's get better at Chess. You can **Click** on a piece to see it's valid moves, if you **Right Click** I'll tell about the valid moves. After you make a move, I'll analyze it and you'll have a chance to **Undo** your move and explore possible responses from your opponent by **Right Clicking** your opponent's pieces, before **Commit**ing to your move. Once you **Commit**, a move cannot be taken back.`,
      },
    ],
  });

  const [playState, setPlayState] = useState<GameState>("choosing");
  const [computerThinking, setComputerThinking] = useState(false);
  const [game, setGame] = useState(chess);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverState, setGameOverState] = useState("");
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<CustomSquareStyles>({});

  const analyzeBoard = (): void => {
    stop();

    append({
      role: "user",
      content: `Please analyze the current state of the game.\n\n${game
        .pgn({ newline: ":" })
        .replace("::", ": ")}\n\nLegal Moves: ${game.moves().join(", ")}`,
    });
  };

  const commitToMove = (): void => {
    if (game.turn() === "b") {
      stop();

      setMoveFrom(null);
      setMoveTo(null);
      setSelectedPiece(null);
      setPossibleMoves({});
      setPlayState("committed");

      if (!game.isGameOver()) {
        if (game.turn() === "b") {
          setComputerThinking(true);

          fetch("/api/bot/reason", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              position: game.pgn(),
              legalMoves: game.moves(),
            }),
          })
            .then(async (response) => {
              if (response.ok) {
                return response.json();
              }
            })
            .then(({ move }) => {
              console.log("MOVE: ", move);

              const gameCopy = new Chess();

              gameCopy.loadPgn(game.pgn());

              // in case the model generates an illegal move
              try {
                gameCopy.move(move);

                append({
                  content: `My opponent played ${move}.\n\n${gameCopy.pgn({ newline: ":" }).replace("::", ": ")}`,
                  role: "user",
                });
              } catch (e) {
                console.error(e);

                const moves = gameCopy.moves({ verbose: true });

                const newMove = moves[Math.floor(Math.random() * moves.length)];

                console.log("GENERATING RANDOM MOVE: ", newMove);

                gameCopy.move(newMove);

                append({
                  content: `My opponent played ${newMove.san}.\n\n${gameCopy.pgn({ newline: ":" }).replace("::", ": ")}`,
                  role: "user",
                });
              }

              setGame(gameCopy);
            })
            .catch((e) => {
              console.error(e);
            })
            .finally(() => {
              setComputerThinking(false);
            });
        }
      } else {
        setGameOver(true);

        if (game.isCheckmate()) {
          setGameOverState("Checkmate");
          append({
            content: `Checkmate.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}`,
            role: "system",
          });
        } else if (game.isDraw()) {
          setGameOverState("Draw");
          append({
            content: `Draw.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}`,
            role: "system",
          });
        } else if (game.isStalemate()) {
          setGameOverState("Stalemate");
          append({
            content: `Stalemate.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}`,
            role: "system",
          });
        } else if (game.isThreefoldRepetition()) {
          setGameOverState("Ended by Repetition");
          append({
            content: `Ended by Repetition.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}`,
            role: "system",
          });
        } else if (game.isDrawByFiftyMoves()) {
          setGameOverState("Draw by Fifty Moves Rule");
          append({
            content: `Draw by Fifty Moves Rule.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}`,
            role: "system",
          });
        }
      }
    }
  };

  const restartGame = (): void => {
    stop();

    const newGame = new Chess();

    // borrowed from: https://blog.mathieuacher.com/GPTsChessEloRatingLegalMoves/
    newGame.header(
      "Event",
      `FIDE World Championship Match ${date.getFullYear()}`,
      "Site",
      "Los Angeles, USA",
      "Date",
      `${date.getFullYear()}.${date.getMonth() + 1 < 10 ? `0` : ``}${date.getMonth() + 1}.${
        date.getDate() < 10 ? `0` : ``
      }${date.getDate()}`,
      "Round",
      "5",
      "White",
      "Carlsen, Magnus",
      "Black",
      "Nepomniachtchi, Ian",
      "WhiteElo",
      "2885",
      "WhiteTitle",
      "GM",
      "WhiteFideId",
      "1503014",
      "BlackElo",
      "2812",
      "BlackTitle",
      "GM",
      "BlackFideId",
      "4168119",
      "TimeControl",
      "40/7200:20/3600:900+30",
      "Variant",
      "Standard"
    );

    setMessages([
      {
        id: "tutor-welcome",
        role: "assistant",
        content: `Let's get better at Chess. You can **Click** on a piece to see it's valid moves, if you **Right Click** I'll tell about the valid moves. After you make a move, I'll analyze it and you'll have a chance to **Undo** your move and explore possible responses from your opponent by **Right Clicking** your opponent's pieces, before **Commit**ing to your move. Once you **Commit**, a move cannot be taken back.`,
      },
    ]);

    setGame(newGame);
    setPlayState("choosing");
    setMoveFrom(null);
    setMoveTo(null);
    setSelectedPiece(null);
    setPossibleMoves({});
    setGameOver(false);
  };

  const undoMove = (): void => {
    stop();

    setGame((g) => {
      const gameCopy = new Chess();

      gameCopy.loadPgn(g.pgn());

      gameCopy.undo();

      setPlayState("choosing");
      setMoveFrom(null);
      setMoveTo(null);
      setSelectedPiece(null);
      setPossibleMoves({});

      return gameCopy;
    });
  };

  const getMoveOptions = (square: Square): boolean => {
    const moves = game.moves({
      square,
      verbose: true,
    });

    if (moves.length === 0) {
      setPossibleMoves({});
      return false;
    }

    const newSquares: CustomSquareStyles = {};

    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to)?.color !== game.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });

    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };

    setPossibleMoves(newSquares);

    return true;
  };

  const convertPieceName = (piece: Piece): string => {
    if (typeof piece === "undefined") {
      return "";
    }

    const color = piece[0] === "w" ? "white" : "black";

    let pieceName = color;

    // convert the wP to "white pawn" and bQ to "black queen", etc.
    const type = piece[1].toLowerCase();

    switch (type) {
      case "r":
        pieceName += " rook";
        break;
      case "n":
        pieceName += " knight";
        break;
      case "b":
        pieceName += " bishop";
        break;
      case "q":
        pieceName += " queen";
        break;
      case "k":
        pieceName += " king";
        break;
      case "p":
      default:
        pieceName += " pawn";
    }

    return pieceName;
  };

  const onSquareClick = (square: Square, piece?: Piece): void => {
    if (moveFrom === null) {
      const canMove = getMoveOptions(square);

      if (canMove) {
        setMoveFrom(square);
        setSelectedPiece(piece ?? null);
        setPlayState("moving");
      } else {
        setPlayState("choosing");
      }
    } else if (moveTo === null) {
      const moves = game.moves({ square: moveFrom, verbose: true });

      const isValidMove = moves.find((move) => move.from === moveFrom && move.to === square);

      if (!isValidMove) {
        const canMove = getMoveOptions(square);

        setMoveFrom(canMove ? square : null);
        setSelectedPiece(canMove ? piece ?? null : null);
        setPlayState(canMove ? "moving" : "choosing");
      } else {
        setMoveTo(square);
        setPlayState("moved");
        setPossibleMoves({});

        // clone game to gameCopy without losing move history
        const gameCopy = new Chess();

        if (game.moveNumber() === 1 && game.turn() === "w") {
          // borrowed from: https://blog.mathieuacher.com/GPTsChessEloRatingLegalMoves/
          gameCopy.header(
            "Event",
            `FIDE World Championship Match ${date.getFullYear()}`,
            "Site",
            "Los Angeles, USA",
            "Date",
            `${date.getFullYear()}.${date.getMonth() + 1 < 10 ? `0` : ``}${date.getMonth() + 1}.${
              date.getDate() < 10 ? `0` : ``
            }${date.getDate()}`,
            "Round",
            "5",
            "White",
            "Carlsen, Magnus",
            "Black",
            "Nepomniachtchi, Ian",
            "WhiteElo",
            "2885",
            "WhiteTitle",
            "GM",
            "WhiteFideId",
            "1503014",
            "BlackElo",
            "2812",
            "BlackTitle",
            "GM",
            "BlackFideId",
            "4168119",
            "TimeControl",
            "40/7200:20/3600:900+30",
            "Variant",
            "Standard"
          );
        } else {
          gameCopy.loadPgn(game.pgn());
        }

        gameCopy.move({ from: moveFrom, to: square });

        setGame(gameCopy);

        if (selectedPiece !== null && game.turn() === "w") {
          append({
            content: `I moved the ${convertPieceName(selectedPiece)} ${moveFrom} to ${square} by playing: ${gameCopy
              .history()
              .at(-1)}.\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}\n\nLegal Moves: ${game.moves().join(", ")}`,
            role: "user",
          });
        }

        setMoveFrom(null);
        setMoveTo(null);
      }
    }
  };

  const onSquareRightClick = (square: Square): void => {
    const canMove = getMoveOptions(square);

    if (canMove) {
      stop();

      const pieceInfo = game.get(square);

      if (typeof pieceInfo !== "undefined") {
        const piece = (pieceInfo?.color + pieceInfo?.type) as Piece;

        if (game.turn() === "w") {
          setMoveFrom(square);
          setSelectedPiece(piece);
          setPlayState("moving");
        }

        append({
          content: `I think ${game.turn() === "w" ? `I want to move` : `my opponent will move`} the ${convertPieceName(
            piece
          )} on ${square}${game.turn() === "w" ? `, but I'm not sure where I should put it` : ``}.${
            game.history().length === 0 ? `This is my opening move.` : ``
          }\n\n${game.pgn({ newline: ":" }).replace("::", ": ")}\n\nLegal Moves: ${game.moves().join(", ")}`,
          role: "user",
        });
      }
    } else {
      if (game.turn() === "w") {
        setMoveFrom(null);
        setSelectedPiece(null);
        setPlayState("choosing");
      }
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      setBoardWidth(containerRef.current.clientHeight);
    }
  }, []);

  return (
    <>
      <div ref={containerRef} className="flex flex-col h-full w-3/4 justify-center items-center relative">
        {boardWidth > 0 && (
          <Chessboard
            arePiecesDraggable={false}
            position={game.fen()}
            onSquareRightClick={onSquareRightClick}
            onSquareClick={onSquareClick}
            customSquareStyles={{ ...possibleMoves }}
            boardWidth={boardWidth}
            customBoardStyle={{
              margin: "auto",
            }}
          />
        )}
        {computerThinking && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
            <Mosaic size="large" color="#31abcc" />
          </div>
        )}
        {gameOver && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-5 rounded-md">
              <h2 className="text-2xl">{gameOverState}</h2>
              <button onClick={restartGame} className="p-2 bg-blue-400 mt-5">
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
      <aside className="flex flex-col h-screen w-1/4">
        <Tutor
          messages={messages}
          playState={playState}
          commit={commitToMove}
          undo={undoMove}
          analyze={analyzeBoard}
          isLoading={isLoading}
          position={game.fen()}
          turn={game.turn()}
          stop={stop}
        />
      </aside>
    </>
  );
}
