# Environment Variables

Create a `.env` file based on `.env.example`.

## Core
- `APP_URL=http://localhost:3000` - Application base URL
- `AUTH_SECRET=...` - Random long secret for authentication (generate with `openssl rand -base64 32`)

## Database (PostgreSQL)
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME`
  - Example: `postgresql://barbershop:password@localhost:5432/barbershop_db`

## Email (Password Recovery)
This project uses **Resend as the primary provider** and supports **SMTP as a fallback**.

### Provider Selection
- `EMAIL_PROVIDER=resend` (default/recommended)
  - Allowed values: `resend` | `smtp`

### Resend (Primary)
- `RESEND_API_KEY=...` - Get from https://resend.com/api-keys
- `EMAIL_FROM="ED Barbearia <no-reply@yourdomain.com>"` - Sender email address

### SMTP (Fallback)
- `SMTP_HOST=localhost`
- `SMTP_PORT=1025`
- `SMTP_SECURE=false` - `true` for port 465; `false` for 587/1025
- `SMTP_USER=` - SMTP username (if required)
- `SMTP_PASS=` - SMTP password (if required)
- `SMTP_FROM="ED Barbearia <no-reply@localhost>"` - Sender email address

#### Local Development Tip
Use **Mailpit** (SMTP catcher) for testing:
```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```
- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

## Instagram (Graph API)
Using the official Instagram Graph API (Business/Creator account required).
- `INSTAGRAM_ACCESS_TOKEN=...` - Long-lived access token
- `INSTAGRAM_USER_ID=...` - Instagram Business/Creator account ID

### How to Get Instagram Credentials
1. Create a Facebook App at https://developers.facebook.com
2. Add Instagram Graph API product
3. Connect your Instagram Business account
4. Generate a long-lived access token
5. Get your Instagram User ID

## Maps (Leaflet + OSM)
Use `NEXT_PUBLIC_*` prefix for browser-side configuration.

- `NEXT_PUBLIC_MAP_DEFAULT_LAT=-23.55052` - Default map center latitude
- `NEXT_PUBLIC_MAP_DEFAULT_LNG=-46.633308` - Default map center longitude
- `NEXT_PUBLIC_MAP_DEFAULT_ZOOM=15` - Default zoom level
- `NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` - Tile URL pattern
- `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© OpenStreetMap contributors` - Attribution text

### Production Note
**Do not use the public OSM tile server** (`tile.openstreetmap.org`) for production with significant traffic.

Alternatives:
- Use a commercial tile provider (Mapbox, Maptiler, Stadia Maps)
- Self-host tiles with TileServer GL
- Use a tile CDN service

Example for Mapbox:
```env
NEXT_PUBLIC_MAP_TILE_URL=https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN
NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© Mapbox © OpenStreetMap
```

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format

# Database commands
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)
npx prisma db seed       # Run seed script
npx prisma studio        # Open Prisma Studio
```
