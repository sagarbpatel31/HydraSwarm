import { connectToRunStream } from "@/lib/stream";

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, ((e: { data: string }) => void)[]> = {};
  onerror: (() => void) | null = null;
  readyState = 1; // OPEN

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, handler: (e: { data: string }) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Test helper to simulate events
  emit(event: string, data: unknown) {
    const handlers = this.listeners[event] || [];
    handlers.forEach((h) => h({ data: JSON.stringify(data) }));
  }

  static CLOSED = 2;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).EventSource = MockEventSource;

beforeEach(() => {
  MockEventSource.instances = [];
});

describe("connectToRunStream", () => {
  test("creates EventSource with correct URL", () => {
    connectToRunStream("run-123", jest.fn());
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toContain("/api/runs/run-123/stream");
  });

  test("returns cleanup function that closes connection", () => {
    const cleanup = connectToRunStream("run-123", jest.fn());
    expect(typeof cleanup).toBe("function");
    cleanup();
    expect(MockEventSource.instances[0].readyState).toBe(2); // CLOSED
  });

  test("calls onEvent for step_update events", () => {
    const onEvent = jest.fn();
    connectToRunStream("run-123", onEvent);
    const es = MockEventSource.instances[0];

    es.emit("step_update", { agentRole: "pm", status: "generating" });
    expect(onEvent).toHaveBeenCalledWith({
      type: "step_update",
      data: { agentRole: "pm", status: "generating" },
    });
  });

  test("calls onEvent for run_complete and closes connection", () => {
    const onEvent = jest.fn();
    connectToRunStream("run-123", onEvent);
    const es = MockEventSource.instances[0];

    es.emit("run_complete", { id: "run-123", status: "completed" });
    expect(onEvent).toHaveBeenCalledWith({
      type: "run_complete",
      data: { id: "run-123", status: "completed" },
    });
    expect(es.readyState).toBe(2); // auto-closed
  });

  test("calls onEvent for run_started events", () => {
    const onEvent = jest.fn();
    connectToRunStream("run-123", onEvent);
    const es = MockEventSource.instances[0];

    es.emit("run_started", { runId: "run-123" });
    expect(onEvent).toHaveBeenCalledWith({
      type: "run_started",
      data: { runId: "run-123" },
    });
  });

  test("handles multiple step_update events", () => {
    const onEvent = jest.fn();
    connectToRunStream("run-123", onEvent);
    const es = MockEventSource.instances[0];

    es.emit("step_update", { agentRole: "pm", status: "recalling" });
    es.emit("step_update", { agentRole: "pm", status: "generating" });
    es.emit("step_update", { agentRole: "pm", status: "done" });
    expect(onEvent).toHaveBeenCalledTimes(3);
  });

  test("ignores malformed event data", () => {
    const onEvent = jest.fn();
    connectToRunStream("run-123", onEvent);
    const es = MockEventSource.instances[0];

    // Simulate malformed data
    const handlers = es.listeners["step_update"] || [];
    handlers.forEach((h) => h({ data: "not json{{{" }));
    expect(onEvent).not.toHaveBeenCalled();
  });

  test("calls onError when error event fires", () => {
    const onEvent = jest.fn();
    const onError = jest.fn();
    connectToRunStream("run-123", onEvent, onError);
    const es = MockEventSource.instances[0];

    // Trigger error listener
    const errorHandlers = es.listeners["error"] || [];
    errorHandlers.forEach((h) => h({ data: "" }));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
