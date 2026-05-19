import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Agendar</Button>);
    expect(screen.getByRole("button", { name: "Agendar" })).toBeInTheDocument();
  });

  it("applies primary variant classes by default", () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-gold");
    expect(btn.className).toContain("text-text-inverse");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border-gold");
    expect(btn.className).toContain("text-gold");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-gold");
    expect(btn.className).not.toContain("border-gold");
    expect(btn.className).not.toContain("bg-gold");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Test</Button>);
    expect(screen.getByRole("button").className).toContain("px-4");
  });

  it("applies md size classes by default", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button").className).toContain("px-6");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">Test</Button>);
    expect(screen.getByRole("button").className).toContain("px-8");
  });

  it("always has rounded-none", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button").className).toContain("rounded-none");
  });

  it("passes through extra props", () => {
    render(<Button disabled>Test</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
