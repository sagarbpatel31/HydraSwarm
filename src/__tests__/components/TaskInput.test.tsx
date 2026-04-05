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

beforeEach(() => { jest.clearAllMocks(); });

describe("TaskInput", () => {
  test("renders with first preset values (notifications)", () => {
    render(<TaskInput {...defaultProps} />);
    expect(screen.getByDisplayValue(/notification system/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("notifications")).toBeInTheDocument();
  });

  test("renders seed, reset, and run buttons", () => {
    render(<TaskInput {...defaultProps} />);
    expect(screen.getByText("Seed demo data")).toBeInTheDocument();
    expect(screen.getByText("Reset view")).toBeInTheDocument();
    expect(screen.getByText("Run HydraSwarm")).toBeInTheDocument();
  });

  test("renders all 4 preset buttons", () => {
    render(<TaskInput {...defaultProps} />);
    // Use getAllByText since "Notifications" appears in multiple places
    expect(screen.getAllByText(/Notifications/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Improve Notifications/)).toBeInTheDocument();
    expect(screen.getByText(/Password Reset/)).toBeInTheDocument();
    expect(screen.getByText(/Product Search/)).toBeInTheDocument();
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

  test("calls onRun with correct payload on submit", async () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText("Run HydraSwarm"));
    await waitFor(() => {
      expect(defaultProps.onRun).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("notification"),
          project: "notifications",
        })
      );
    });
  });

  test("clicking Password Reset preset updates fields", () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText(/Password Reset/));
    expect(screen.getByDisplayValue(/password reset/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("user-auth")).toBeInTheDocument();
  });

  test("clicking Product Search preset updates fields", () => {
    render(<TaskInput {...defaultProps} />);
    fireEvent.click(screen.getByText(/Product Search/));
    expect(screen.getByDisplayValue(/product search/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("marketplace")).toBeInTheDocument();
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

  test("updates title on input change", async () => {
    render(<TaskInput {...defaultProps} />);
    const user = userEvent.setup();
    const titleInput = screen.getByDisplayValue(/notification system/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Custom task");
    expect(titleInput).toHaveValue("Custom task");
  });

  test("description textarea has 5 rows", () => {
    render(<TaskInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Describe the engineering task/i);
    expect(textarea).toHaveAttribute("rows", "5");
  });
});
