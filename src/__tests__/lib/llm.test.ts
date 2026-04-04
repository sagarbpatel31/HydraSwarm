const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { callClaude } from "@/lib/llm";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("callClaude", () => {
  test("calls OpenAI chat.completions.create", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hello from GPT" } }],
    });
    const result = await callClaude("Test prompt");
    expect(result).toBe("Hello from GPT");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("uses gpt-4o-mini model", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
    });
    await callClaude("Test");
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4o-mini");
  });

  test("uses default max_tokens and temperature", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
    });
    await callClaude("Test");
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(4096);
    expect(callArgs.temperature).toBe(0.7);
  });

  test("overrides max_tokens and temperature when provided", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
    });
    await callClaude("Test", { maxTokens: 1024, temperature: 0.3 });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(1024);
    expect(callArgs.temperature).toBe(0.3);
  });

  test("includes system message when provided", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
    });
    await callClaude("User prompt", { system: "You are a helpful assistant" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(2);
    expect(callArgs.messages[0]).toEqual({
      role: "system",
      content: "You are a helpful assistant",
    });
    expect(callArgs.messages[1]).toEqual({
      role: "user",
      content: "User prompt",
    });
  });

  test("omits system message when not provided", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
    });
    await callClaude("User prompt");
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(1);
    expect(callArgs.messages[0].role).toBe("user");
  });

  test("throws on empty response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });
    await expect(callClaude("Test")).rejects.toThrow("Empty response from OpenAI");
  });

  test("throws on missing choices", async () => {
    mockCreate.mockResolvedValue({ choices: [] });
    await expect(callClaude("Test")).rejects.toThrow();
  });
});
