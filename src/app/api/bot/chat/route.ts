import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { ANALYZER_PROMPT } from "../../../../lib/prompts";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const result = await streamText({
    model: openai.chat("gpt-4o", {
      structuredOutputs: true,
    }),
    system: ANALYZER_PROMPT,
    messages: [messages.at(-1)],
  });

  return result.toDataStreamResponse();
}
