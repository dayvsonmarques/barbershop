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

  it("applies wide tracking class", () => {
    render(<SectionLabel label="Test" />);
    expect(screen.getByText("— Test —").className).toContain("uppercase");
  });
});
