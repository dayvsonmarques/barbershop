import { render, screen } from "@testing-library/react";
import { SectionLabel } from "@/components/ui/section-label";

describe("SectionLabel", () => {
  it("renders with em-dash decorators around the label", () => {
    render(<SectionLabel label="Serviços" />);
    expect(screen.getByText("— Serviços —")).toBeInTheDocument();
  });

  it("applies gold color class", () => {
    render(<SectionLabel label="Test" />);
    expect(screen.getByText("— Test —").className).toContain("text-gold");
  });

  it("applies uppercase class", () => {
    render(<SectionLabel label="Test" />);
    expect(screen.getByText("— Test —").className).toContain("uppercase");
  });

  it("appends custom className when provided", () => {
    render(<SectionLabel label="Test" className="mt-6" />);
    expect(screen.getByText("— Test —").className).toContain("mt-6");
  });
});
