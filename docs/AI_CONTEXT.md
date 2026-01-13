# AI Context (Project Continuation)

## Project Overview
Barbershop web application built with:
- **Next.js** (latest stable) + App Router + TypeScript
- **TailwindCSS** for styling
- **PostgreSQL** + Prisma ORM
- **Validation:** Zod
- **Auth:** Login + password recovery (Resend primary + SMTP fallback)
- **Authorization:** RBAC (groups/permissions) per page + action (view/create/update/delete)

## Language Rules
- **Codebase naming:** English (en-US) for all identifiers, filenames, folder names, internal route names.
- **UI labels/content:** pt-BR (Portuguese) for all visible texts to users.

## Key Business Rules
- Each **Service** has an **estimated duration in minutes**.
- **Availability** supports **recurrence** (day/week/month) and **exceptions**.
- **Single location** (one unit only).
- **No payments**; reservations/bookings only.
- Prevent **booking conflicts** (same barber + time slot).

## Architecture Decisions
- Folder structure: `app/`, `components/`, `lib/`, `prisma/`, `services/`, `repositories/`
- Server Actions or Route Handlers for write operations with Zod validation
- UI components reusable and responsive (mobile-first)
- Admin layout based on "nextjs-admin-dashboard-main" template

## Home Page Sections
1. Fullscreen slider (3 banners) with arrows, dots, drag/swipe
2. About section (2 columns: image/text)
3. 3 cards: Services, Courses, Bookings
4. Instagram feed (via Graph API)
5. Map section with marker from admin settings (Leaflet + OSM)
6. Footer with logo, opening hours + address, large Instagram icon/link (from admin settings)

## Admin Scope
- CRUD for all entities
- Establishment settings: opening hours, Instagram link, address, map coords
- Login + password reset
- RBAC protection (default deny)
- Admin layout with sidebar, header, breadcrumbs

## Non-goals
- Payment integration
- Multi-location support

## Tech Stack Details
- Maps: **Leaflet + OpenStreetMap (OSM)** (MVP)
- Email: **Resend** (primary) + **SMTP** (fallback)
- Instagram: **Graph API**
