import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { OPPONENT_REASONING_PROMPT } from "../../../../lib/prompts";

export async function POST(req: Request) {
  const { position, legalMoves } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const results = await generateText({
    // there's some anectodal evidence that the "gpt-3.5-turbo-instruct" model
    // is actually pretty good at understanding chess PGN notation and playing
    // valid moves that make sense
    model: openai.chat("gpt-4o"),
    system: OPPONENT_REASONING_PROMPT,
    messages: [
      {
        role: "user",
        content: position,
      },
      {
        role: "user",
        content: `Legal Moves: ${legalMoves.join(", ")}`,
      },
    ],
    temperature: 0.7,
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
