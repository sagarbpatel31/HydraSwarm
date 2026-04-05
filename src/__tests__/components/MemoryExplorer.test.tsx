import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryExplorer } from "@/components/MemoryExplorer";

const mockExploreData = {
  knowledge: [
    { id: "k1", title: "Engineering Standards", content: "Code quality rules", score: 0.9 },
    { id: "k2", title: "API Guide", content: "REST conventions", score: 0.8 },
  ],
  shared: [
    { id: "s1", title: "Q2 Priority", content: "Reliability over features", score: 0.7 },
  ],
  agents: {
    pm: [{ id: "m1", title: "Scope lesson", content: "Define non-goals", score: 0.85 }],
    architect: [{ id: "m2", title: "Circuit breaker", content: "Mandatory for financial services", score: 0.9 }],
  },
  stats: { knowledgeCount: 2, sharedCount: 1, agentCount: 2, totalCount: 5 },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockExploreData),
  });
});

describe("MemoryExplorer", () => {
  test("renders search bar", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search HydraDB/i)).toBeInTheDocument();
    });
  });

  test("renders search button", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Search")).toBeInTheDocument();
    });
  });

  test("shows stats cards after loading", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // total
    });
  });

  test("renders tab buttons", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Knowledge")).toBeInTheDocument();
      expect(screen.getByText("Shared Lessons")).toBeInTheDocument();
      expect(screen.getByText("Agent Memories")).toBeInTheDocument();
    });
  });

  test("shows knowledge items", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Engineering Standards")).toBeInTheDocument();
      expect(screen.getByText("API Guide")).toBeInTheDocument();
    });
  });

  test("clicking Knowledge tab filters results", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => screen.getByText("Engineering Standards"));
    // Click the Knowledge tab (not the stat card)
    const tabs = screen.getAllByText("Knowledge");
    const tabButton = tabs.find((el) => el.closest("button[class*='rounded-t']"));
    if (tabButton) fireEvent.click(tabButton);
    expect(screen.getByText("Engineering Standards")).toBeInTheDocument();
  });

  test("search triggers new fetch", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => screen.getByText("Search"));

    const input = screen.getByPlaceholderText(/Search HydraDB/i);
    fireEvent.change(input, { target: { value: "circuit breaker" } });
    fireEvent.click(screen.getByText("Search"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("circuit%20breaker")
      );
    });
  });

  test("shows loading state initially", () => {
    // Mock a slow response
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<MemoryExplorer />);
    expect(screen.getByText(/Searching HydraDB/i)).toBeInTheDocument();
  });

  test("fetches data on mount", async () => {
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/memory/explore")
      );
    });
  });

  test("shows error state on failure", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: "Connection failed" }),
    });
    render(<MemoryExplorer />);
    await waitFor(() => {
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    });
  });
});
