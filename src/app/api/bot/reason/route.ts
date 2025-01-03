import { CoreMessage, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { OPPONENT_REASONING_PROMPT } from "../../../../lib/prompts";
import { API_CONFIG } from "../../../../lib/config";

export async function POST(req: Request) {
  const { position, legalMoves, board } = await req.json();

  const openai = createOpenAI(API_CONFIG);

  const messages: CoreMessage[] = [
    {
      role: "user",
      content: position,
    },
  ];

  if (typeof legalMoves !== "undefined") {
    messages.push({
      role: "user",
      content: `Legal Moves: ${legalMoves.join(", ")}`,
    });
  }

  if (typeof board !== "undefined") {
    messages.push({
      role: "user",
      content: `Board State: ${board}`,
    });
  }

  const results = await generateText({
    // there's some anectodal evidence that the "gpt-3.5-turbo-instruct" model
    // is actually pretty good at understanding chess PGN notation and playing
    // valid moves that make sense
    model: openai.chat("gpt-4o"),
    system: OPPONENT_REASONING_PROMPT,
    messages,
    temperature: 0.57,
    // this is slightly larger than the likely maximum tokens for a legal move
    maxTokens: 6,
  });

  // @ts-expect-error the response format seems to have content as an Array with an object with a text property
  let move = results.response.messages[0].content[0].text.trim();

  if (move.includes(".")) {
    move = move.replace(/\./g, "").trim();
  }

  if (move.includes(" ")) {
    move = move.split(" ").at(-1);
  }

  return Response.json({ move });
}
