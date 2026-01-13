# Authentication System

## Overview
Authentication system using JWT tokens with password reset functionality via email.

## Components

### 1. JWT Authentication (`lib/auth.ts`)
- **signToken**: Creates JWT with 7-day expiration
- **verifyToken**: Validates JWT and returns payload
- **generateResetToken**: Generates random token for password reset

### 2. Email Service (`lib/email.ts`)
- **sendEmail**: Sends email via Resend (primary) or SMTP (fallback)
- **generatePasswordResetEmail**: Creates HTML email template for password reset

### 3. Rate Limiting (`lib/rate-limit.ts`)
- In-memory rate limiter (production: use Redis)
- Configurable limits per endpoint
- Auto-cleanup of old entries

### 4. API Routes

#### POST `/api/auth/login`
Authenticates user and returns JWT.

**Request:**
```json
{
  "email": "admin@edbarbearia.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "cuid123",
    "email": "admin@edbarbearia.com",
    "name": "Administrador"
  }
}
```

**Rate limit:** 5 requests per 15 minutes per IP

#### POST `/api/auth/request-reset`
Requests password reset email.

**Request:**
```json
{
  "email": "admin@edbarbearia.com"
}
```

**Response (200):**
```json
{
  "message": "Se o e-mail existir, você receberá instruções para redefinir sua senha."
}
```

**Rate limit:** 3 requests per hour per IP

#### POST `/api/auth/reset-password`
Resets password using token from email.

**Request:**
```json
{
  "token": "abc123xyz789",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

**Rate limit:** 5 requests per 15 minutes per IP

## Usage

### Login Flow
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();

// Store token (e.g., localStorage, cookie)
localStorage.setItem('token', token);
```

### Protected API Call
```typescript
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Password Reset Flow
1. User requests reset:
```typescript
await fetch('/api/auth/request-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});
```

2. User receives email with link: `https://app.com/auth/reset-password?token=abc123`

3. User submits new password:
```typescript
await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, newPassword }),
});
```

### Using Auth Middleware
```typescript
import { authMiddleware } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  
  if (auth instanceof NextResponse) {
    return auth; // Unauthorized
  }
  
  // auth.userId and auth.email are available
  // ... protected logic
}
```

## Security Features

1. **Rate Limiting**
   - Login: 5 attempts per 15 minutes
   - Password reset request: 3 attempts per hour
   - Password reset: 5 attempts per 15 minutes

2. **Password Hashing**
   - bcryptjs with 10 rounds

3. **Token Security**
   - JWT with HS256 algorithm
   - 7-day expiration
   - Password reset tokens expire in 1 hour
   - Single-use reset tokens

4. **Information Disclosure Prevention**
   - Password reset doesn't reveal if email exists
   - Generic error messages for invalid credentials

5. **Input Validation**
   - Zod schemas for all inputs
   - Email format validation
   - Minimum password length (6 characters)

## Environment Variables
```env
# Required
AUTH_SECRET=your-long-random-secret
APP_URL=http://localhost:3000

# Email (choose provider)
EMAIL_PROVIDER=resend|smtp

# Resend
RESEND_API_KEY=re_xxx
EMAIL_FROM="ED Barbearia <no-reply@yourdomain.com>"

# SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="ED Barbearia <no-reply@localhost>"
```

## Testing

### Test Credentials (from seed)
- Email: `admin@edbarbearia.com`
- Password: `password123`

### Local Email Testing
Use Mailpit for SMTP testing:
```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```
- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

## Production Considerations

1. **Rate Limiting**
   - Replace in-memory store with Redis
   - Use distributed rate limiting (e.g., upstash/ratelimit)

2. **Email**
   - Configure Resend with verified domain
   - Set up proper SPF/DKIM/DMARC records
   - Monitor email delivery rates

3. **Security**
   - Use strong AUTH_SECRET (32+ characters)
   - Enable HTTPS only
   - Set secure cookie flags
   - Implement CSRF protection
   - Add email verification for new accounts
   - Consider 2FA for admin accounts

4. **Monitoring**
   - Log failed login attempts
   - Alert on unusual rate limit triggers
   - Track password reset usage
