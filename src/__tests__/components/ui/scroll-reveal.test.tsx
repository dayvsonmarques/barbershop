import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// IntersectionObserver is not available in happy-dom; mock it
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockObserve.mockReset();
  mockDisconnect.mockReset();
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function () {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(
      <ScrollReveal>
        <p>Hello</p>
      </ScrollReveal>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("starts with opacity-0 class before intersection", () => {
    render(<ScrollReveal><p>content</p></ScrollReveal>);
    const wrapper = screen.getByText("content").parentElement!;
    expect(wrapper.className).toContain("opacity-0");
  });

  it("attaches an IntersectionObserver", () => {
    render(<ScrollReveal><p>content</p></ScrollReveal>);
    expect(mockObserve).toHaveBeenCalled();
  });
});
