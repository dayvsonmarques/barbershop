# Implementation Plan

This document tracks the implementation progress following the gradual commit strategy.

## Etapa 1: Bootstrap ✅ (Current)
- [x] Next.js + Tailwind + TypeScript + ESLint/Prettier
- [x] Initial folder structure and conventions
- [x] `/docs` initial documentation
- [x] `.env.example`
- **Commit:** `chore: bootstrap next.js with tailwind, typescript, and project docs`

## Etapa 2: Infrastructure (Data Layer) 🔄 (Next)
- [ ] Install and configure Prisma
- [ ] Create complete database schema
  - [ ] Users, Groups, Permissions (RBAC)
  - [ ] Barbers
  - [ ] Service Categories & Services (with duration)
  - [ ] Availability & Exceptions
  - [ ] Bookings (with status)
  - [ ] Product Categories & Products
  - [ ] Courses
  - [ ] Establishment Settings
- [ ] Create initial migration
- [ ] Create seed script with sample data
- [ ] Update `/docs` with data model documentation
- **Commit:** `feat: add prisma schema with complete data model and seed`

## Etapa 3: Auth + Password Recovery
- [ ] Install dependencies (bcrypt, jsonwebtoken or next-auth)
- [ ] Create auth service/repository
- [ ] Login endpoint/action
- [ ] Password recovery flow (token generation, expiration)
- [ ] Email service (Resend + SMTP fallback)
- [ ] Rate limiting middleware
- [ ] Update `/docs` with auth flow documentation
- **Commit:** `feat: implement authentication and password recovery`

## Etapa 4: RBAC (Role-Based Access Control)
- [ ] Create permission checking utilities
- [ ] Create route protection middleware
- [ ] Create action-level authorization helpers
- [ ] Default deny policy implementation
- [ ] Update `/docs` with RBAC documentation
- **Commit:** `feat: implement rbac with groups and permissions`

## Etapa 5: Admin Shell (Layout)
- [ ] Adapt layout from "nextjs-admin-dashboard-main" template
- [ ] Create Sidebar component
- [ ] Create Header component
- [ ] Create Breadcrumbs component
- [ ] Create protected admin layout
- [ ] Create dashboard page scaffold
- [ ] Update `/docs` with admin structure
- **Commit:** `feat(admin): create admin layout shell with sidebar and header`

## Etapa 6: CRUDs (Multiple commits - one per domain)

### 6.1: Service Categories & Services
- [ ] Create service category CRUD (list, create, update, delete)
- [ ] Create service CRUD with duration field
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add service categories and services crud`

### 6.2: Barbers
- [ ] Create barber CRUD
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add barbers crud`

### 6.3: Availability & Exceptions
- [ ] Create availability CRUD with recurrence (day/week/month)
- [ ] Create exceptions management
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add availability and exceptions management`

### 6.4: Bookings
- [ ] Create booking CRUD
- [ ] Status management (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- [ ] Conflict detection logic
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add bookings crud with conflict detection`

### 6.5: Product Categories & Products
- [ ] Create product category CRUD
- [ ] Create product CRUD
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add product categories and products crud`

### 6.6: Courses
- [ ] Create course CRUD (type: PRESENCIAL/ONLINE, status: ATIVO/INATIVO)
- [ ] Form validation with Zod
- [ ] UI tables and forms
- **Commit:** `feat(admin): add courses crud`

### 6.7: Establishment Settings
- [ ] Create settings management page
- [ ] Opening hours configuration
- [ ] Instagram link configuration
- [ ] Address configuration
- [ ] Map coordinates (lat/lng) configuration
- [ ] Form validation with Zod
- **Commit:** `feat(admin): add establishment settings management`

## Etapa 7: Public Site (Multiple commits)

### 7.1: Home - Banner & About
- [ ] Create fullscreen banner slider component
- [ ] Add arrows, dots, drag/swipe support
- [ ] Create About section (2 columns)
- [ ] Responsive design
- **Commit:** `feat(public): add home banner slider and about section`

### 7.2: Home - Service Cards
- [ ] Create 3-card section (Services, Courses, Bookings)
- [ ] Link cards to respective pages
- [ ] Responsive design
- **Commit:** `feat(public): add service cards section to home`

### 7.3: Instagram Feed
- [ ] Install Instagram Graph API client
- [ ] Create Instagram feed component
- [ ] Fetch and display feed from @edbarbearia
- [ ] Error handling and fallback
- [ ] Responsive design
- **Commit:** `feat(public): add instagram feed integration`

### 7.4: Map Section
- [ ] Install Leaflet and React-Leaflet
- [ ] Create Map component with OSM tiles
- [ ] Load coordinates from establishment settings
- [ ] Add marker to map
- [ ] Responsive design (100vw x 70vh)
- **Commit:** `feat(public): add map section with leaflet and osm`

### 7.5: Footer
- [ ] Create footer with 3 columns
- [ ] Load dynamic data from establishment settings
- [ ] Responsive design
- **Commit:** `feat(public): add dynamic footer with establishment info`

### 7.6: Additional Pages
- [ ] Create Services listing page
- [ ] Create Courses listing page
- [ ] Create basic booking flow page
- **Commit:** `feat(public): add services, courses, and booking pages`

## Etapa 8: Booking Flow
- [ ] Create booking selection flow (service → barber → date/time)
- [ ] Implement availability checking
- [ ] Implement conflict prevention
- [ ] Create booking confirmation
- [ ] Add booking status transitions
- [ ] Form validation with Zod
- **Commit:** `feat(public): implement complete booking flow with validation`

## Etapa 9: Tests + Hardening
- [ ] Unit tests for Zod schemas
- [ ] Unit tests for availability calculations
- [ ] Unit tests for conflict detection
- [ ] Integration tests for auth flow
- [ ] Integration tests for RBAC
- [ ] Security review (XSS, CSRF protection)
- [ ] Performance optimization
- [ ] Update `/docs` with testing guide
- **Commit:** `test: add unit and integration tests with security hardening`

## Future Improvements Checklist
- [ ] Email templates with React Email
- [ ] Push notifications for booking confirmations
- [ ] SMS integration for reminders
- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Advanced analytics dashboard
- [ ] Customer loyalty program
- [ ] Online payment integration
- [ ] Multi-location support
- [ ] Mobile app (React Native)
