# Barbershop Web Application

A complete web application for barbershop management built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** Custom auth with JWT
- **Email:** Resend (primary) + SMTP (fallback)
- **Maps:** Leaflet + OpenStreetMap
- **Instagram:** Graph API

## 📋 Features

### Public Site
- 🏠 Home page with fullscreen banner slider
- 📖 About section
- 💈 Services, Courses, and Booking cards
- 📸 Instagram feed integration
- 🗺️ Interactive map with location marker
- 📱 Fully responsive design

### Admin Panel
- 👥 User management with RBAC (Role-Based Access Control)
- 💇 Barber management
- 📅 Availability and exception management
- 📝 Booking management with conflict detection
- 🏪 Service and product catalogs
- 🎓 Course management
- ⚙️ Establishment settings (hours, location, social media)

### Booking System
- Real-time availability checking
- Conflict prevention
- Multiple status tracking (Pending, Confirmed, Cancelled, Completed)
- Service duration-based slot calculation

## 🏗️ Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin routes (protected)
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utilities and helpers
├── prisma/               # Database schema and migrations
├── services/             # Business logic
├── repositories/         # Data access layer
└── docs/                 # Documentation
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration. See [docs/ENV.md](docs/ENV.md) for details.

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npx prisma studio` - Open Prisma Studio (database GUI)

## 📚 Documentation

- [AI Context](docs/AI_CONTEXT.md) - Project overview and AI continuation guide
- [Conventions](docs/CONVENTIONS.md) - Coding standards and best practices
- [Environment Variables](docs/ENV.md) - Complete environment configuration guide
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development roadmap and progress

## 🌐 Language Convention

- **Code:** English (en-US) - All code, variables, functions, comments
- **UI:** Portuguese (pt-BR) - All visible text and labels for users

## 🔒 Security

- RBAC with default-deny policy
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- CSRF protection
- XSS prevention
- Server-side validation with Zod

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 🤝 Contributing

[Add contributing guidelines here]
