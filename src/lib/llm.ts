import OpenAI from "openai";
import { LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE } from "./config";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _client;
}

export async function callClaude(
  prompt: string,
  options?: {
    system?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    max_tokens: options?.maxTokens ?? LLM_MAX_TOKENS,
    temperature: options?.temperature ?? LLM_TEMPERATURE,
    messages: [
      ...(options?.system
        ? [{ role: "system" as const, content: options.system }]
        : []),
      { role: "user" as const, content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }
  return content;
}
