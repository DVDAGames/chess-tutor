import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { OPPONENT_PROMPT } from "../../../../lib/prompts";

export async function POST(req: Request) {
  const { position } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const results = await generateText({
    // there's some anectodal evidence that the "gpt-3.5-turbo-instruct" model
    // is actually pretty good at understanding chess PGN notation and playing
    // valid moves that make sense
    model: openai.completion("gpt-3.5-turbo-instruct"),
    system: OPPONENT_PROMPT,
    messages: [{ role: "user", content: position }],
  });

  return Response.json({ move: results.text });
}
