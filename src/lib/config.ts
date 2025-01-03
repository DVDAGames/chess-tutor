import { OpenAIProviderSettings } from "@ai-sdk/openai";

const BASE_API_CONFIG: OpenAIProviderSettings = {
  apiKey: process.env.API_KEY,
};

// check for developer-defined BASE_URL
if (typeof process?.env?.BASE_URL !== "undefined" && process.env.BASE_URL !== "") {
  BASE_API_CONFIG.baseURL = process.env.BASE_URL;
}

export const API_CONFIG = BASE_API_CONFIG;
