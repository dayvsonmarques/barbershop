# Design Spec: Landing Page Redesign — ED Barbearia

**Date:** 2026-05-18
**Branch:** feature/new-layout
**Status:** Approved

---

## 1. Context

The existing landing page (`src/app/page.tsx`) uses Geist fonts, white backgrounds, and a loosely styled component set with no unified design system. This spec covers a full redesign of the public-facing landing page into a dark, gold-accented aesthetic based on the Figma Barbershop Template.

All existing components in `src/components/` are replaced. The admin area, `/agendar`, and API routes are out of scope.

---

## 2. Design System

### 2.1 Configuration approach

**Tailwind v4 CSS-first.** All design tokens are declared inside an `@theme { }` block in `src/app/globals.css`. The existing `tailwind.config.ts` retains only the `content` paths and is otherwise left minimal.

### 2.2 Color palette

| Token | Value | Usage |
|---|---|---|
| `--color-background-primary` | `#0A0A0A` | Page background |
| `--color-background-secondary` | `#111111` | Card / section background |
| `--color-background-tertiary` | `#1A1A1A` | Elevated surfaces, hover states |
| `--color-gold` | `#C9A84C` | Primary accent — the only accent color |
| `--color-gold-light` | `#E2C068` | Hover state on gold elements |
| `--color-gold-dark` | `#A07830` | Active/pressed gold |
| `--color-text-primary` | `#F5F5F0` | Headings |
| `--color-text-secondary` | `#A0A09A` | Body / muted text |
| `--color-text-inverse` | `#0A0A0A` | Text on gold buttons |
| `--color-border` | `#2A2A2A` | Dividers and card borders |

No blue. No purple. No white backgrounds anywhere.

### 2.3 Typography

Two Google Fonts loaded via `next/font/google` in `layout.tsx` — never via `@import` in CSS.

| Font | Variable | Usage |
|---|---|---|
| Playfair Display (700, 900) | `--font-heading` | Display headings, quotes |
| Inter (default weights) | `--font-body` | All body text, labels, buttons |

Font size tokens:
- `--font-size-hero`: `clamp(3rem, 8vw, 6rem)` / line-height `1.05` / letter-spacing `-0.02em`
- `--font-size-section`: `clamp(2rem, 4vw, 3.5rem)` / line-height `1.1`

### 2.4 Shape

All corners are **sharp** (`border-radius: 0`). This is intentional — brutalist/classic barbershop feel. No rounded cards, no pill buttons.

---

## 3. File Structure

```
src/
  app/
    globals.css          ← @theme block with all design tokens + base resets
    layout.tsx           ← Playfair Display + Inter, dark body bg, metadata
    page.tsx             ← Landing page composed from section components
  components/
    ui/
      button.tsx         ← Primitive: variants + sizes
      section-label.tsx  ← Primitive: decorative uppercase label
    navbar.tsx
    hero-section.tsx
    services-section.tsx
    team-section.tsx
    testimonials-section.tsx
    about-section.tsx    ← redesigned from existing
    instagram-feed.tsx   ← redesigned from existing
    map-section.tsx      ← redesigned from existing (keeps Leaflet)
    booking-cta.tsx
    footer.tsx
```

All components are **Server Components** unless noted. The only Client Component is `navbar.tsx` (hamburger menu state).

---

## 4. Components

### 4.1 `ui/button.tsx`

**Props:** `variant: "primary" | "outline" | "ghost"`, `size: "sm" | "md" | "lg"`, standard button HTML props.

| Variant | Default style | Hover |
|---|---|---|
| primary | gold bg, `text-inverse`, uppercase | bg shifts to `gold-light` |
| outline | gold border, gold text, transparent bg | bg fills gold, text becomes inverse |
| ghost | no border, gold text | opacity change |

- Sharp corners (`rounded-none`)
- Text: uppercase, `tracking-widest`, `text-xs`, `font-semibold`
- Sizes map to padding increments (sm: small padding, lg: large padding)
- `transition-colors duration-300 ease-out` on all variants

### 4.2 `ui/section-label.tsx`

**Props:** `label: string`, optional `className`.

Renders: `— LABEL —` in gold, `text-xs tracking-[0.25em] font-semibold uppercase mb-3`.

### 4.3 `navbar.tsx` — Client Component

- Sticky top, `bg-background-primary/90 backdrop-blur-sm`, `border-b border-border`
- Logo: font-heading, gold, left-aligned
- Nav links: `text-text-secondary hover:text-gold transition-colors`, centered
- CTA button: `Button variant="primary" size="sm"`, right-aligned
- **Mobile (< 768px):** hamburger icon button toggles full-screen overlay (`position: fixed, inset-0`) with stacked nav links and CTA. Uses `useState` for open/close.

### 4.4 `hero-section.tsx`

- Full viewport height (`min-h-screen`)
- Background: `bg-background-primary`
- Layout: left-aligned content, vertically centered
- Headline: `font-heading text-hero text-text-primary`, one word/span wrapped in `text-gold`
- Subtext: `text-text-secondary`, max-width constrained
- CTA row: two `Button` components — primary + outline — with horizontal gap
- Optional: subtle CSS noise texture via `background-image: url("data:image/svg+xml,...")` — no external images required

### 4.5 `services-section.tsx` + `ServiceCard`

- Section padding with `SectionLabel` + section headline
- Grid: 1 column on mobile → 3 columns at `md:`
- **ServiceCard props:** `title`, `description`, `price`, optional `icon`
- Card styles: `bg-background-secondary border-t-2 border-gold p-6`
- Price displayed in `text-gold font-semibold`
- Hover: `bg-background-tertiary transition-colors duration-300`
- ServiceCard defined inline in `services-section.tsx` (not a separate file — it's only used here)

### 4.6 `team-section.tsx` + `TeamCard`

- Grid: 1 column mobile → 3 columns at `md:`
- **TeamCard props:** `name`, `role`, `imageSrc`, `imageAlt`
- Photo: `next/image`, `filter: grayscale(1)` → `grayscale(0)` on hover via CSS class
- Name: `font-heading text-text-primary`
- Role: `text-gold text-xs tracking-wide uppercase`
- TeamCard defined inline in `team-section.tsx`

### 4.7 `testimonials-section.tsx` + `TestimonialCard`

- Grid: 1 column mobile → 2 or 3 columns at `md:`
- **TestimonialCard props:** `quote`, `author`, `rating` (1–5)
- Decorative gold quotation mark SVG top-left of card
- Quote: `font-heading italic text-lg text-text-primary`
- Author: `text-text-secondary text-sm`
- Stars: rendered as gold SVG stars based on `rating`
- TestimonialCard defined inline in `testimonials-section.tsx`

### 4.8 `about-section.tsx`

- Two-column layout at `md:` (text left, visual right)
- Uses `SectionLabel` + section headline
- Body text in `text-text-secondary`
- Right column: decorative block with gold border and a short statement — no external image required (fallback to styled div)
- Preserves content from the original about section (barbearia story, values)

### 4.9 `instagram-feed.tsx`

- Redesigned wrapper with dark background and `SectionLabel` + section headline
- Grid 3×2 of placeholder squares (`bg-background-tertiary border border-border`)
- Each cell has a subtle gold overlay on hover
- If real images are added to `/public`, they use `next/image` with `object-cover`

### 4.10 `map-section.tsx`

- Wrapper redesigned with dark bg, `SectionLabel`, section headline, address in `text-text-secondary`
- The Leaflet map instance is preserved from the existing implementation
- Map container wrapped in a `border border-border` div
- The Leaflet CSS import stays in the component or in `globals.css`

### 4.11 `booking-cta.tsx`

- Full-width section, `bg-background-secondary`
- Large centered headline (`font-heading text-section text-text-primary`)
- Short subtext below in `text-text-secondary`
- `Button variant="primary" size="lg"` centered, links to `/agendar`

### 4.12 `footer.tsx`

- `bg-background-primary`, `border-t border-gold/30` at the top
- Three-column layout: logo + tagline left, nav links center, social icons right
- Logo: `font-heading text-gold`
- Tagline: `text-text-secondary text-sm`
- Social icons: SVG inline icons (Instagram, WhatsApp, Facebook), `text-text-secondary hover:text-gold`
- Copyright line at the very bottom, `text-text-secondary text-xs`

---

## 5. Page Composition (`app/page.tsx`)

```
<Navbar />
<HeroSection />
<ServicesSection />
<AboutSection />
<TeamSection />
<TestimonialsSection />
<InstagramFeed />
<MapSection />
<BookingCTA />
<Footer />
```

Each section is imported from `@/components/`. The page itself is a Server Component with no state.

---

## 6. Animations

A `<ScrollReveal>` Client Component wrapper in `components/ui/scroll-reveal.tsx` applies fade-in via `IntersectionObserver`. Section components remain Server Components — they are wrapped by `<ScrollReveal>` in `page.tsx` where animation is desired.

- Initial state: `opacity-0 translate-y-4`
- Revealed state: `opacity-100 translate-y-0`
- Transition: `duration-300 ease-out`
- Props: `children`, optional `className`
- No Framer Motion — zero new dependencies

**Note on inlined sub-components:** `ServiceCard`, `TeamCard`, and `TestimonialCard` are defined and exported from within their parent section file (not separate files). This is intentional — they are used in exactly one place.

---

## 7. Data / Content

All content (services list, team members, testimonials) is **hardcoded** as static arrays inside each section component. No CMS, no database queries, no `fetch` calls on the landing page. This is intentional — content changes go through code.

---

## 8. Out of Scope

- `/agendar` page — not touched
- `/admin` area — not touched
- API routes — not touched
- Authentication — not touched
- Real Instagram API integration — placeholder grid only
- Animations beyond scroll reveal — no parallax, no complex sequences
