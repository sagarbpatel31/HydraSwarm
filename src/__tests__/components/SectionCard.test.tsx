import { render, screen } from "@testing-library/react";
import { SectionCard } from "@/components/SectionCard";

describe("SectionCard", () => {
  test("renders title", () => {
    render(<SectionCard title="Test Title">Content</SectionCard>);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  test("renders children", () => {
    render(<SectionCard title="Title"><p>Child content</p></SectionCard>);
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  test("renders subtitle when provided", () => {
    render(<SectionCard title="Title" subtitle="Subtitle text">Content</SectionCard>);
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  test("does not render subtitle when omitted", () => {
    render(<SectionCard title="Title">Content</SectionCard>);
    expect(screen.queryByText("Subtitle text")).not.toBeInTheDocument();
  });

  test("renders actions when provided", () => {
    render(
      <SectionCard title="Title" actions={<button>Action</button>}>
        Content
      </SectionCard>
    );
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  test("does not render actions when omitted", () => {
    const { container } = render(<SectionCard title="Title">Content</SectionCard>);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  test("applies custom className", () => {
    const { container } = render(
      <SectionCard title="Title" className="custom-class">Content</SectionCard>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  test("has default styling classes", () => {
    const { container } = render(<SectionCard title="Title">Content</SectionCard>);
    const section = container.firstChild as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section.className).toContain("rounded-2xl");
    expect(section.className).toContain("backdrop-blur");
  });

  test("title is an h2 element", () => {
    render(<SectionCard title="My Title">Content</SectionCard>);
    const heading = screen.getByText("My Title");
    expect(heading.tagName).toBe("H2");
  });
});
