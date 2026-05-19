# Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the ED Barbearia public landing page with a dark/gold design system based on the Figma Barbershop Template, replacing all existing landing components.

**Architecture:** Tailwind v4 CSS-first tokens in `globals.css`, all sections as Server Components, only `Navbar` and `ScrollReveal` as Client Components. Static content hardcoded in components; `MapSection` and `Footer` preserve existing API fetch from `/api/public/settings`.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, next/font/google (Playfair Display + Inter), Leaflet (existing), Vitest + @testing-library/react.

---

## File Map

| File | Action |
|---|---|
| `src/app/globals.css` | Modify — add `@theme` design tokens block |
| `src/app/layout.tsx` | Modify — replace Geist with Playfair Display + Inter |
| `tailwind.config.ts` | Modify — strip theme extensions, keep content paths |
| `src/components/ui/button.tsx` | Create |
| `src/components/ui/section-label.tsx` | Create |
| `src/components/ui/scroll-reveal.tsx` | Create (Client Component) |
| `src/components/navbar.tsx` | Create (Client Component) |
| `src/components/hero-section.tsx` | Create |
| `src/components/services-section.tsx` | Create |
| `src/components/about-section.tsx` | Replace existing |
| `src/components/team-section.tsx` | Create |
| `src/components/testimonials-section.tsx` | Create |
| `src/components/instagram-feed.tsx` | Replace existing |
| `src/components/map-section.tsx` | Replace existing (preserve Leaflet logic) |
| `src/components/booking-cta.tsx` | Create |
| `src/components/footer.tsx` | Replace existing (preserve settings API fetch) |
| `src/app/page.tsx` | Replace — compose new sections |
| `src/__tests__/components/ui/button.test.tsx` | Create |
| `src/__tests__/components/ui/section-label.test.tsx` | Create |
| `src/__tests__/components/ui/scroll-reveal.test.tsx` | Create |
| `src/components/home-header.tsx` | Delete |
| `src/components/banner-slider.tsx` | Delete |
| `src/components/service-cards.tsx` | Delete |

---

## Task 1: Design system foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace globals.css**

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Static design tokens — baked into utility classes at build time */
@theme {
  --color-background-primary: #0A0A0A;
  --color-background-secondary: #111111;
  --color-background-tertiary: #1A1A1A;
  --color-gold: #C9A84C;
  --color-gold-light: #E2C068;
  --color-gold-dark: #A07830;
  --color-text-primary: #F5F5F0;
  --color-text-secondary: #A0A09A;
  --color-text-inverse: #0A0A0A;
  --color-border: #2A2A2A;
}

/* Dynamic tokens — resolved at runtime so var() from next/font works */
@theme inline {
  --font-heading: var(--font-playfair), serif;
  --font-body: var(--font-inter), sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  background-color: #0A0A0A;
  color: #F5F5F0;
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Replace layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ED Barbearia",
  description: "Barbearia em Recife — agendamentos e serviços",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Simplify tailwind.config.ts**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
```

- [ ] **Step 4: Start the dev server and verify the page background is #0A0A0A**

```bash
npm run dev
```

Open http://localhost:3000 — body should be near-black. If you see white, check that `globals.css` is imported in `layout.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx tailwind.config.ts
git commit -m "feat: add dark/gold design system via Tailwind v4 @theme"
```

---

## Task 2: Button primitive

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/__tests__/components/ui/button.test.tsx`

- [ ] **Step 1: Create the test directory and write failing tests**

```bash
mkdir -p src/__tests__/components/ui
```

```tsx
// src/__tests__/components/ui/button.test.tsx
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
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Test</Button>);
    expect(screen.getByRole("button").className).toContain("px-4");
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- button.test
```

Expected: FAIL — `Cannot find module '@/components/ui/button'`

- [ ] **Step 3: Create the Button component**

```tsx
// src/components/ui/button.tsx
import { clsx } from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<string, string> = {
  primary:
    "bg-gold text-text-inverse hover:bg-gold-light",
  outline:
    "border border-gold text-gold hover:bg-gold hover:text-text-inverse",
  ghost: "text-gold hover:opacity-75",
};

const sizeClasses: Record<string, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-none uppercase tracking-widest text-xs font-semibold",
        "transition-colors duration-300 ease-out cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- button.test
```

Expected: PASS — 8 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.tsx src/__tests__/components/ui/button.test.tsx
git commit -m "feat: add Button primitive with variant/size support"
```

---

## Task 3: SectionLabel primitive

**Files:**
- Create: `src/components/ui/section-label.tsx`
- Create: `src/__tests__/components/ui/section-label.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/__tests__/components/ui/section-label.test.tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- section-label.test
```

Expected: FAIL — `Cannot find module '@/components/ui/section-label'`

- [ ] **Step 3: Create the SectionLabel component**

```tsx
// src/components/ui/section-label.tsx
type SectionLabelProps = {
  label: string;
  className?: string;
};

export function SectionLabel({ label, className }: SectionLabelProps) {
  return (
    <p
      className={`text-gold text-xs tracking-[0.25em] font-semibold uppercase mb-3 ${className ?? ""}`}
    >
      — {label} —
    </p>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- section-label.test
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/section-label.tsx src/__tests__/components/ui/section-label.test.tsx
git commit -m "feat: add SectionLabel primitive"
```

---

## Task 4: ScrollReveal Client Component

**Files:**
- Create: `src/components/ui/scroll-reveal.tsx`
- Create: `src/__tests__/components/ui/scroll-reveal.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/__tests__/components/ui/scroll-reveal.test.tsx
import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// IntersectionObserver is not available in happy-dom; mock it
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
    }))
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- scroll-reveal.test
```

Expected: FAIL — `Cannot find module '@/components/ui/scroll-reveal'`

- [ ] **Step 3: Create the ScrollReveal component**

```tsx
// src/components/ui/scroll-reveal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- scroll-reveal.test
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npm test
```

Expected: All previously passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/scroll-reveal.tsx src/__tests__/components/ui/scroll-reveal.test.tsx
git commit -m "feat: add ScrollReveal Client Component with IntersectionObserver"
```

---

## Task 5: Navbar

**Files:**
- Create: `src/components/navbar.tsx`

- [ ] **Step 1: Create navbar.tsx**

```tsx
// src/components/navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#equipe", label: "Equipe" },
  { href: "#local", label: "Localização" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background-primary/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-gold text-xl font-bold">
          ED Barbearia
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-gold transition-colors duration-300 text-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/agendar" className="hidden md:block">
            <Button variant="primary" size="sm">
              Agendar
            </Button>
          </Link>

          <button
            className="md:hidden text-text-primary p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-background-primary flex flex-col items-center justify-center gap-10 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-heading text-2xl text-text-primary hover:text-gold transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link href="/agendar" onClick={() => setOpen(false)}>
            <Button variant="primary" size="lg">
              Agendar Horário
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Verify in browser**

With `npm run dev` running, open http://localhost:3000. The navbar won't appear yet (page.tsx still imports old components). You can verify by temporarily importing Navbar in page.tsx, or proceed to Task 15 to wire everything together.

- [ ] **Step 3: Commit**

```bash
git add src/components/navbar.tsx
git commit -m "feat: add Navbar with sticky header and mobile overlay menu"
```

---

## Task 6: HeroSection

**Files:**
- Create: `src/components/hero-section.tsx`

- [ ] **Step 1: Create hero-section.tsx**

```tsx
// src/components/hero-section.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="min-h-screen bg-background-primary flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl">
          <h1
            className="font-heading text-text-primary mb-6"
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              lineHeight: "1.05",
              letterSpacing: "-0.02em",
            }}
          >
            The Art of{" "}
            <span className="text-gold">The Cut</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 max-w-xl leading-relaxed">
            Tradição, estilo e precisão. Em Recife, a barbearia que transforma
            cada visita em experiência.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/agendar">
              <Button variant="primary" size="lg">
                Agendar Horário
              </Button>
            </Link>
            <a href="#servicos">
              <Button variant="outline" size="lg">
                Ver Serviços
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hero-section.tsx
git commit -m "feat: add HeroSection with gold accent headline and CTA row"
```

---

## Task 7: ServicesSection

**Files:**
- Create: `src/components/services-section.tsx`

- [ ] **Step 1: Create services-section.tsx**

```tsx
// src/components/services-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Service = {
  title: string;
  description: string;
  price: string;
};

const services: Service[] = [
  {
    title: "Corte Clássico",
    description: "Corte tradicional com navalha e acabamento perfeito.",
    price: "R$ 45",
  },
  {
    title: "Barba Completa",
    description: "Modelagem e hidratação com produtos premium.",
    price: "R$ 35",
  },
  {
    title: "Corte + Barba",
    description: "Combo completo com relaxamento de couro cabeludo.",
    price: "R$ 70",
  },
  {
    title: "Degradê",
    description: "Fade moderno com transições precisas.",
    price: "R$ 50",
  },
  {
    title: "Sobrancelha",
    description: "Design e modelagem com navalha.",
    price: "R$ 20",
  },
  {
    title: "Hidratação",
    description: "Tratamento intensivo para cabelo e barba.",
    price: "R$ 40",
  },
];

function ServiceCard({ title, description, price }: Service) {
  return (
    <div className="bg-background-secondary border-t-2 border-gold p-6 hover:bg-background-tertiary transition-colors duration-300">
      <h3 className="font-heading text-text-primary text-xl mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        {description}
      </p>
      <span className="text-gold font-semibold text-lg">{price}</span>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section id="servicos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Serviços" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que oferecemos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/services-section.tsx
git commit -m "feat: add ServicesSection with gold-top-bordered ServiceCard grid"
```

---

## Task 8: AboutSection

**Files:**
- Replace: `src/components/about-section.tsx`

- [ ] **Step 1: Replace about-section.tsx**

```tsx
// src/components/about-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel label="Sobre nós" />
            <h2
              className="font-heading text-text-primary mb-6"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                lineHeight: "1.1",
              }}
            >
              Tradição desde 2010
            </h2>
            <p className="text-text-secondary mb-4 leading-relaxed">
              A ED Barbearia nasceu do amor pelo ofício. Mais de uma década
              cuidando do visual de homens que valorizam estilo e precisão em
              Recife.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Nossos barbeiros são artistas. Cada corte é uma obra — executada
              com técnica, respeito e os melhores equipamentos do mercado.
            </p>
          </div>
          <div className="border border-gold/30 p-12 flex items-center justify-center min-h-70">
            <p className="font-heading text-gold text-2xl text-center italic leading-snug">
              "A arte do <br /> corte perfeito."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/about-section.tsx
git commit -m "feat: redesign AboutSection with new dark/gold design system"
```

---

## Task 9: TeamSection

**Files:**
- Create: `src/components/team-section.tsx`

Note: Real barber photos go in `/public/team/` (e.g. `eduardo.jpg`). Leave `imageSrc` as empty string until photos are available — the card shows a placeholder silhouette instead.

- [ ] **Step 1: Create team-section.tsx**

```tsx
// src/components/team-section.tsx
import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

type TeamMember = {
  name: string;
  role: string;
  imageSrc: string;
  imageAlt: string;
};

const team: TeamMember[] = [
  {
    name: "Eduardo Silva",
    role: "Fundador & Barbeiro Sênior",
    imageSrc: "",
    imageAlt: "Eduardo Silva",
  },
  {
    name: "Carlos Mendes",
    role: "Especialista em Barba",
    imageSrc: "",
    imageAlt: "Carlos Mendes",
  },
  {
    name: "Rafael Costa",
    role: "Mestre em Degradê",
    imageSrc: "",
    imageAlt: "Rafael Costa",
  },
];

function TeamCard({ name, role, imageSrc, imageAlt }: TeamMember) {
  return (
    <div className="group">
      <div className="relative aspect-3/4 overflow-hidden mb-4 bg-background-tertiary border border-border">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2A2A2A"
              strokeWidth="1"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="font-heading text-text-primary text-xl">{name}</h3>
      <p className="text-gold text-xs tracking-wide uppercase mt-1">{role}</p>
    </div>
  );
}

export function TeamSection() {
  return (
    <section id="equipe" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Equipe" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Nossos barbeiros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/team-section.tsx
git commit -m "feat: add TeamSection with grayscale-to-color hover on photos"
```

---

## Task 10: TestimonialsSection

**Files:**
- Create: `src/components/testimonials-section.tsx`

- [ ] **Step 1: Create testimonials-section.tsx**

```tsx
// src/components/testimonials-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Testimonial = {
  quote: string;
  author: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Melhor barbearia de Recife, sem dúvida. O corte durou semanas perfeito.",
    author: "Marcos Oliveira",
    rating: 5,
  },
  {
    quote:
      "Atendimento impecável e resultado acima das expectativas. Voltarei sempre.",
    author: "João Paulo",
    rating: 5,
  },
  {
    quote:
      "A barba ficou exatamente como eu queria. Profissionais de verdade.",
    author: "Lucas Ferreira",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mt-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? "#C9A84C" : "none"}
          stroke="#C9A84C"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author, rating }: Testimonial) {
  return (
    <div className="bg-background-secondary p-8 relative">
      <svg
        className="absolute top-6 left-6 text-gold opacity-25"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="#C9A84C"
        aria-hidden="true"
      >
        <text x="0" y="44" fontSize="56" fontFamily="Georgia, serif">
          &#8220;
        </text>
      </svg>
      <blockquote className="font-heading italic text-lg text-text-primary pt-8 leading-snug">
        {quote}
      </blockquote>
      <footer className="mt-4">
        <p className="text-text-secondary text-sm">{author}</p>
        <Stars count={rating} />
      </footer>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.author} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/testimonials-section.tsx
git commit -m "feat: add TestimonialsSection with gold quotation marks and star ratings"
```

---

## Task 11: InstagramFeed

**Files:**
- Replace: `src/components/instagram-feed.tsx`

- [ ] **Step 1: Replace instagram-feed.tsx**

```tsx
// src/components/instagram-feed.tsx
import { SectionLabel } from "@/components/ui/section-label";

export function InstagramFeed() {
  return (
    <section id="instagram" className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Instagram" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          @edbarbearia
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-background-tertiary border border-border hover:border-gold/50 transition-colors duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/instagram-feed.tsx
git commit -m "feat: redesign InstagramFeed with dark/gold theme"
```

---

## Task 12: MapSection

**Files:**
- Replace: `src/components/map-section.tsx`

This task preserves all existing Leaflet logic (dynamic import, settings API fetch, marker, tile layer). Only the outer wrapper markup is redesigned.

- [ ] **Step 1: Replace map-section.tsx**

```tsx
// src/components/map-section.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";

type PublicSettings = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
    "© OpenStreetMap contributors © CARTO";

  const fallbackLat = Number(
    process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -8.0260634
  );
  const fallbackLng = Number(
    process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -34.9196525
  );
  const fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 16);

  const mapCenter = useMemo(
    () => ({
      lat: settings?.latitude ?? fallbackLat,
      lng: settings?.longitude ?? fallbackLng,
    }),
    [settings?.latitude, settings?.longitude, fallbackLat, fallbackLng]
  );

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    if (!document.querySelector('link[data-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }

    import("leaflet").then((leafletModule) => {
      const L = (leafletModule as any).default ?? leafletModule;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          scrollWheelZoom: false,
        }).setView([mapCenter.lat, mapCenter.lng], fallbackZoom);

        map.scrollWheelZoom.disable();

        L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(map);

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="background-color:#000;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:14px;height:14px;border-radius:9999px;background:white;"></div>
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker([mapCenter.lat, mapCenter.lng], {
          icon: customIcon,
        }).addTo(map);
        markerRef.current = marker;
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (map) map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());

      if (markerRef.current) {
        markerRef.current.setLatLng([mapCenter.lat, mapCenter.lng]);
        markerRef.current.bindPopup(
          `<div style="text-align:center;padding:8px;">
            <strong style="font-size:16px;display:block;margin-bottom:4px;">${settings?.name ?? "ED Barbearia"}</strong>
            <p style="margin:0;color:#666;">${settings?.address ?? "Rua casa amarela, 73, Recife"}</p>
          </div>`.trim()
        );
      }
    });
  }, [
    mapCenter.lat,
    mapCenter.lng,
    fallbackZoom,
    tileUrl,
    tileAttribution,
    settings?.address,
    settings?.name,
  ]);

  return (
    <section id="local" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <SectionLabel label="Localização" />
        <h2
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Onde estamos
        </h2>
        <p className="text-text-secondary">
          {settings?.address ?? "Rua casa amarela, 73 — Recife, PE"}
        </p>
      </div>
      <div className="border-y border-border">
        <div
          ref={mapRef}
          className="h-[60vh] w-full"
          style={{ filter: "grayscale(1) contrast(1.08)" }}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map-section.tsx
git commit -m "feat: redesign MapSection wrapper with dark theme, preserve Leaflet logic"
```

---

## Task 13: BookingCTA

**Files:**
- Create: `src/components/booking-cta.tsx`

- [ ] **Step 1: Create booking-cta.tsx**

```tsx
// src/components/booking-cta.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export function BookingCTA() {
  return (
    <section className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <SectionLabel label="Agendamento" />
        <h2
          className="font-heading text-text-primary mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Pronto para o próximo corte?
        </h2>
        <p className="text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
          Agende agora mesmo e garanta seu horário com os melhores barbeiros de
          Recife.
        </p>
        <Link href="/agendar">
          <Button variant="primary" size="lg">
            Agendar Agora
          </Button>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking-cta.tsx
git commit -m "feat: add BookingCTA section"
```

---

## Task 14: Footer

**Files:**
- Replace: `src/components/footer.tsx`

This task redesigns the footer with the new theme while preserving the settings API fetch (name, hours, address, instagram, whatsapp).

- [ ] **Step 1: Replace footer.tsx**

```tsx
// src/components/footer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type PublicSettings = {
  name?: string;
  address?: string;
  instagramUrl?: string | null;
  instagramUsername?: string | null;
  openingHours?: Record<string, string>;
  phone?: string | null;
};

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#equipe", label: "Equipe" },
  { href: "#local", label: "Localização" },
];

export function Footer() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {});
  }, []);

  const storeName = settings?.name ?? "ED Barbearia";
  const instagramUrl =
    settings?.instagramUrl ?? "https://instagram.com/edbarbearia";

  const phoneDigits = (settings?.phone ?? "").replace(/\D/g, "");
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  const hoursSummary = useMemo(() => {
    const h = settings?.openingHours ?? {};
    const weekdays = [h.monday, h.tuesday, h.wednesday, h.thursday, h.friday].filter(Boolean);
    const allSame = weekdays.length === 5 && weekdays.every((v) => v === weekdays[0]);
    const lines: string[] = [];
    if (allSame) lines.push(`Seg–Sex: ${weekdays[0]}`);
    if (h.saturday) lines.push(`Sábado: ${h.saturday}`);
    return lines.length ? lines : ["Horário não informado"];
  }, [settings?.openingHours]);

  return (
    <footer className="bg-background-primary border-t border-gold/30 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <p className="font-heading text-gold text-2xl font-bold mb-3">
              {storeName}
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Tradição, estilo e precisão em Recife.
            </p>
            {hoursSummary.map((line) => (
              <p key={line} className="text-text-secondary text-sm mt-1">
                {line}
              </p>
            ))}
          </div>

          <div>
            <p className="text-text-primary font-semibold uppercase text-xs tracking-widest mb-4">
              Navegação
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-text-secondary hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-text-primary font-semibold uppercase text-xs tracking-widest mb-4">
              Redes Sociais
            </p>
            <div className="flex gap-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-gold transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-gold transition-colors duration-300"
                  aria-label="WhatsApp"
                >
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-text-secondary text-xs">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/footer.tsx
git commit -m "feat: redesign Footer with dark/gold theme, preserve settings API data"
```

---

## Task 15: Page composition + cleanup

**Files:**
- Replace: `src/app/page.tsx`
- Delete: `src/components/home-header.tsx`
- Delete: `src/components/banner-slider.tsx`
- Delete: `src/components/service-cards.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
// src/app/page.tsx
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { AboutSection } from "@/components/about-section";
import { TeamSection } from "@/components/team-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { InstagramFeed } from "@/components/instagram-feed";
import { MapSection } from "@/components/map-section";
import { BookingCTA } from "@/components/booking-cta";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ScrollReveal>
        <ServicesSection />
      </ScrollReveal>
      <ScrollReveal>
        <AboutSection />
      </ScrollReveal>
      <ScrollReveal>
        <TeamSection />
      </ScrollReveal>
      <ScrollReveal>
        <TestimonialsSection />
      </ScrollReveal>
      <ScrollReveal>
        <InstagramFeed />
      </ScrollReveal>
      <MapSection />
      <ScrollReveal>
        <BookingCTA />
      </ScrollReveal>
      <Footer />
    </main>
  );
}
```

Note: `MapSection` is not wrapped in `ScrollReveal` because it has its own mounting lifecycle (Leaflet).

- [ ] **Step 2: Delete replaced components**

```bash
rm src/components/home-header.tsx
rm src/components/banner-slider.tsx
rm src/components/service-cards.tsx
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests pass. If any test imports a deleted component, fix the import.

- [ ] **Step 4: Verify in browser**

With `npm run dev` running:
- Open http://localhost:3000
- Check: black background, gold navbar logo, hero text with gold accent word
- Check: services grid with gold top borders
- Check: about section with gold quote block
- Check: testimonials with quotation marks
- Check: instagram placeholder grid
- Check: Leaflet map renders
- Check: BookingCTA section
- Check: footer with nav links and social icons
- Resize to mobile — hamburger menu should appear and open full-screen overlay

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: compose landing page with new dark/gold sections"

git rm src/components/home-header.tsx src/components/banner-slider.tsx src/components/service-cards.tsx
git commit -m "chore: remove replaced landing page components"
```
