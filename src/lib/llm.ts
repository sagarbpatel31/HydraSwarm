import Anthropic from "@anthropic-ai/sdk";
import { LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE } from "./config";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
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
  const response = await client.messages.create({
    model: LLM_MODEL,
    max_tokens: options?.maxTokens ?? LLM_MAX_TOKENS,
    temperature: options?.temperature ?? LLM_TEMPERATURE,
    system: options?.system,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response type from Claude");
}
