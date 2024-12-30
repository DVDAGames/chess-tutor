import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { encode, decode } from "gpt-tokenizer/model/gpt-3.5-turbo-instruct";

import { OPPONENT_PROMPT } from "../../../../lib/prompts";

export async function POST(req: Request) {
  const { position, legalMoves } = await req.json();

  console.log(legalMoves);

  const lastMove = position.split(" ").at(-1);

  const positionTokens = encode(lastMove);

  console.log(
    lastMove,
    positionTokens.map((token) => decode([token])),
    positionTokens
  );

  const positionLogitBias: Record<number, number> = positionTokens.reduce((bias: Record<number, number>, token) => {
    bias[token] = -1;

    return bias;
  }, {});

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const results = await generateText({
    // there's some anectodal evidence that the "gpt-3.5-turbo-instruct" model
    // is actually pretty good at understanding chess PGN notation and playing
    // valid moves that make sense
    model: openai.completion("gpt-3.5-turbo-instruct", {
      logitBias: positionLogitBias,
    }),
    system: OPPONENT_PROMPT,
    prompt: position,
    temperature: 0.0,
    maxTokens: 6,
  });

  // @ts-expect-error the response format seems to have content as an Array with an object with a text property
  let move = results.response.messages[0].content[0].text.trim();

  console.log("MOVE: ", move);

  if (move.includes(".")) {
    move = move.replace(/\./g, "").trim();
  }

  if (move.includes(" ")) {
    move = move.split(" ").at(-1);
  }

  // if this wasn't a legal move or is the same move the user made, try again
  if (!legalMoves.includes(move)) {
    const moveTokens = encode(move);

    console.log(
      position.split(" ").at(-1),
      move,
      moveTokens.map((token) => decode([token])),
      moveTokens
    );

    // let's try to avoid generating the same move again by biasing the model
    // against the piece it already tried to move
    const moveLogitBias: Record<number, number> = moveTokens.reduce((bias: Record<number, number>, token, index) => {
      if (index === 0) {
        bias[token] = -100;
      } else {
        bias[token] = -5;
      }

      return bias;
    }, {});

    const secondResults = await generateText({
      // there's some anectodal evidence that the "gpt-3.5-turbo-instruct" model
      // is actually pretty good at understanding chess PGN notation and playing
      // valid moves that make sense
      model: openai.completion("gpt-3.5-turbo-instruct", {
        logitBias: moveLogitBias,
      }),
      system: OPPONENT_PROMPT,
      prompt: position,
      temperature: 0.5,
      maxTokens: 6,
    });

    // @ts-expect-error the response format seems to have content as an Array with an object with a text property
    move = secondResults.response.messages[0].content[0].text.trim();

    if (move.includes(".")) {
      move = move.replace(/\./g, "").trim();
    }

    if (move.includes(" ")) {
      move = move.split(" ").at(-1);
    }
  }

  console.log("MOVE: ", move);

  return Response.json({ move });
}
