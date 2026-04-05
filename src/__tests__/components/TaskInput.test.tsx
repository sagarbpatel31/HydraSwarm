import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskInput } from "@/components/TaskInput";

const defaultProps = {
  onRun: jest.fn().mockResolvedValue(undefined),
  onSeed: jest.fn().mockResolvedValue(undefined),
  onReset: jest.fn(),
  busy: false,
  seeding: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TaskInput", () => {
  test("renders with first preset values", () => {
    render(<TaskInput {...defaultProps} />);
    const titleInput = screen.getByDisplayValue(/rate limiting and audit logs to the billing API/i);
    expect(titleInput).toBeInTheDocument();
    const projectInput = screen.getByDisplayValue("billing-api");
    expect(projectInput).toBeInTheDocument();
  });

  test("renders seed, reset, and run buttons", () => {
    render(<TaskInput {...defaultProps} />);
    expect(screen.getByText("Seed demo data")).toBeInTheDocument();
    expect(screen.getByText("Reset view")).toBeInTheDocument();
    expect(screen.getByText("Run HydraSwarm")).toBeInTheDocument();
  });

  test("renders Load Task preset buttons", () => {
    render(<TaskInput {...defaultProps} />);
    expect(screen.getByText("Load Task 1")).toBeInTheDocument();
    expect(screen.getByText("Load Task 2")).toBeInTheDocument();
  });

  test("calls onSeed when seed button clicked", async () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText("Seed demo data"));
    await waitFor(() => {
      expect(defaultProps.onSeed).toHaveBeenCalledTimes(1);
    });
  });

  test("calls onReset when reset button clicked", () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText("Reset view"));
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  test("calls onRun with correct payload on form submit", async () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText("Run HydraSwarm"));
    await waitFor(() => {
      expect(defaultProps.onRun).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("rate limiting"),
          project: "billing-api",
        })
      );
    });
  });

  test("updates title on input change", async () => {
    render(<TaskInput {...defaultProps} />);
    const user = userEvent.setup();
    const titleInput = screen.getByDisplayValue(/rate limiting and audit logs to the billing API/i);
    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    expect(titleInput).toHaveValue("New title");
  });

  test("loads Task 2 preset when clicked", () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText("Load Task 2"));
    // Title input changes to Task 2 title
    const titleInput = screen.getByPlaceholderText(/Add rate limiting and audit logs/i) as HTMLInputElement;
    expect(titleInput.value).toContain("invoice endpoints");
  });

  test("disables run button when busy", () => {
    render(<TaskInput {...defaultProps} busy={true} />);
    const runButton = screen.getByText("Run HydraSwarm").closest("button");
    expect(runButton).toBeDisabled();
  });

  test("disables seed button when seeding", () => {
    render(<TaskInput {...defaultProps} seeding={true} />);
    const seedButton = screen.getByText("Seed demo data").closest("button");
    expect(seedButton).toBeDisabled();
  });

  test("disables seed button when busy", () => {
    render(<TaskInput {...defaultProps} busy={true} />);
    const seedButton = screen.getByText("Seed demo data").closest("button");
    expect(seedButton).toBeDisabled();
  });

  test("description textarea has 5 rows", () => {
    render(<TaskInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Describe the engineering task/i);
    expect(textarea).toHaveAttribute("rows", "5");
  });

  test("switching between presets updates title field", () => {
    render(<TaskInput {...defaultProps} />);
    const titleInput = screen.getByPlaceholderText(/Add rate limiting and audit logs/i) as HTMLInputElement;

    fireEvent.click(screen.getByText("Load Task 2"));
    expect(titleInput.value).toContain("invoice endpoints");

    fireEvent.click(screen.getByText("Load Task 1"));
    expect(titleInput.value).toContain("billing API");
  });
});
