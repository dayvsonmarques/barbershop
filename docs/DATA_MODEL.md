# Data Model Documentation

## Overview
This document describes the complete database schema for the Barbershop application.

## Entity Relationship Diagram

```
Users ─────┬───── UserGroups ───── Groups ─────┬───── GroupPermissions ───── Permissions
           │                                    │
           └─── PasswordResets                  │
           └─── Bookings (creator)              │

Barbers ────┬─── Bookings
            ├─── BarberAvailability ───── Services
            └─── AvailabilityExceptions

ServiceCategories ───── Services ───── Bookings

ProductCategories ───── Products

Courses (standalone)

EstablishmentSettings (singleton)
```

## Entities

### 1. RBAC (Role-Based Access Control)

#### User
Stores user account information for admin access.
- `id`: Unique identifier (CUID)
- `email`: Unique email (login)
- `password`: Hashed password (bcrypt)
- `name`: Full name
- `isActive`: Account status
- **Relations:** groups (N:N), passwordResets, createdBookings

#### Group
User groups/roles (e.g., Admin, Receptionist, Barber).
- `id`: Auto-increment ID
- `name`: Unique group name
- `description`: Optional description
- **Relations:** users (N:N), permissions (N:N)

#### Permission
Fine-grained permissions for resources and actions.
- `id`: Auto-increment ID
- `resource`: Resource name (e.g., "services", "bookings")
- `action`: Action type ("view", "create", "update", "delete")
- **Relations:** groups (N:N)
- **Constraint:** Unique combination of (resource, action)

#### UserGroup (Join Table)
Links users to groups (many-to-many).

#### GroupPermission (Join Table)
Links groups to permissions (many-to-many).

#### PasswordReset
Tracks password reset tokens.
- `id`: Unique identifier (CUID)
- `userId`: User requesting reset
- `token`: Unique reset token
- `expiresAt`: Token expiration timestamp
- `used`: Whether token was already used
- **Indexes:** token, userId

### 2. Services & Categories

#### ServiceCategory
Categories for services (e.g., "Cabelo", "Barba", "Combo").
- `id`: Auto-increment ID
- `name`: Unique category name
- `description`: Optional description
- `isActive`: Visibility status

#### Service
Individual services offered.
- `id`: Auto-increment ID
- `categoryId`: Foreign key to ServiceCategory
- `name`: Service name
- `description`: Optional description
- **`duration`**: **Estimated duration in minutes** (critical for slot calculation)
- `price`: Service price (Decimal 10,2)
- `isActive`: Availability status
- **Relations:** category, bookings, availability

### 3. Barbers

#### Barber
Barber profiles.
- `id`: Auto-increment ID
- `name`: Barber's name
- `email`: Optional unique email
- `phone`: Optional phone
- `bio`: Optional biography
- `photoUrl`: Optional photo URL
- `isActive`: Active status
- **Relations:** bookings, availability, exceptions

### 4. Availability & Exceptions

#### BarberAvailability
Regular availability patterns with recurrence support.
- `id`: Auto-increment ID
- `barberId`: Foreign key to Barber
- `serviceId`: Optional service filter (null = all services)
- **`recurrenceType`**: DAILY | WEEKLY | MONTHLY
- **`dayOfWeek`**: For WEEKLY (SUNDAY...SATURDAY)
- **`dayOfMonth`**: For MONTHLY (1-31)
- `startTime`: Start time (HH:MM format, e.g., "09:00")
- `endTime`: End time (HH:MM format, e.g., "18:00")
- `isActive`: Active status

**Example recurrences:**
- DAILY: Every day from 09:00 to 18:00
- WEEKLY + MONDAY: Every Monday from 09:00 to 18:00
- MONTHLY + 15: Every 15th of the month from 09:00 to 18:00

#### AvailabilityException
Exceptions to regular availability (holidays, special hours, etc.).
- `id`: Auto-increment ID
- `barberId`: Foreign key to Barber
- `date`: Specific date (Date type)
- **`type`**: BLOCKED | SPECIAL
  - **BLOCKED**: Barber unavailable (startTime/endTime = null)
  - **SPECIAL**: Custom hours (requires startTime/endTime)
- `startTime`: Optional custom start time (for SPECIAL)
- `endTime`: Optional custom end time (for SPECIAL)
- `reason`: Optional reason text
- **Constraint:** Unique (barberId, date)

### 5. Bookings

#### Booking
Customer appointments.
- `id`: Unique identifier (CUID)
- `barberId`: Foreign key to Barber
- `serviceId`: Foreign key to Service
- `createdBy`: Optional User ID (creator, can be null for public bookings)
- `customerName`: Customer's name
- `customerEmail`: Optional customer email
- `customerPhone`: Optional customer phone
- `scheduledAt`: Appointment date/time
- **`status`**: PENDING | CONFIRMED | CANCELLED | COMPLETED
- `notes`: Optional notes
- **Constraints:**
  - Unique (barberId, scheduledAt) - prevents double-booking
- **Indexes:** scheduledAt, status

### 6. Products & Categories

#### ProductCategory
Categories for products (e.g., "Pomadas", "Óleos para Barba").
- `id`: Auto-increment ID
- `name`: Unique category name
- `description`: Optional description
- `isActive`: Visibility status

#### Product
Products for sale.
- `id`: Auto-increment ID
- `categoryId`: Foreign key to ProductCategory
- `name`: Product name
- `description`: Optional description
- `price`: Product price (Decimal 10,2)
- `stock`: Available quantity
- `imageUrl`: Optional image URL
- `isActive`: Visibility status

### 7. Courses

#### Course
Educational courses offered.
- `id`: Auto-increment ID
- `title`: Course title
- `description`: Course description
- **`type`**: PRESENCIAL | ONLINE
- **`duration`**: Duration in hours
- `price`: Optional course price (Decimal 10,2)
- `imageUrl`: Optional image URL
- **`status`**: ATIVO | INATIVO

### 8. Establishment Settings

#### EstablishmentSettings
Global settings for the establishment (singleton table).
- `id`: Fixed to 1 (only one row allowed)
- `name`: Establishment name (default: "ED Barbearia")
- **`openingHours`**: JSON string with hours per day
  ```json
  {
    "monday": "09:00-18:00",
    "tuesday": "09:00-18:00",
    "sunday": "Fechado"
  }
  ```
- `address`: Full address text
- **`latitude`**: Map latitude (Decimal 10,7)
- **`longitude`**: Map longitude (Decimal 10,7)
- `instagramUrl`: Full Instagram profile URL
- `instagramUsername`: Instagram handle (without @)
- `phone`: Contact phone
- `email`: Contact email

## Key Business Rules

### 1. Booking Conflict Prevention
- **Database constraint:** Unique (barberId, scheduledAt)
- **Application logic:** Must check availability before creating booking
- **Duration-based calculation:** Use service.duration to calculate end time and detect overlaps

### 2. Availability Calculation
Algorithm to determine if a barber is available at a specific date/time:
1. Check if date has an EXCEPTION:
   - BLOCKED → unavailable
   - SPECIAL → use exception hours
2. If no exception, check RECURRENCE rules:
   - Find matching recurrence (DAILY, WEEKLY+day, MONTHLY+day)
   - Check if time falls within startTime-endTime
3. Check for existing bookings at that time (conflict)

### 3. Status Transitions (Booking)
Recommended flow:
- `PENDING` → `CONFIRMED` (receptionist confirms)
- `CONFIRMED` → `COMPLETED` (service finished)
- `PENDING` or `CONFIRMED` → `CANCELLED` (customer/receptionist cancels)

### 4. RBAC Authorization
- **Default deny:** All routes/actions denied by default
- **Check:** user → groups → permissions → resource+action
- **Example:** User in "Recepcionista" group has permission "bookings" + "create"

## Seed Data
The seed script (`prisma/seed.ts`) creates:
- 3 groups (Administrador, Recepcionista, Barbeiro)
- 32 permissions (8 resources × 4 actions)
- 2 users (admin, receptionist) with hashed password: `password123`
- 3 service categories + 5 services
- 2 barbers with weekly availability
- 3 product categories + 3 products
- 3 courses
- 1 establishment settings record

## Migrations

```bash
# Create new migration
npx prisma migrate dev --name descriptive_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only - WARNING: deletes all data)
npx prisma migrate reset
```

## Common Queries

### Get user permissions
```typescript
const permissions = await prisma.permission.findMany({
  where: {
    groups: {
      some: {
        group: {
          users: {
            some: { userId: userId }
          }
        }
      }
    }
  }
});
```

### Get barber availability for a specific date
```typescript
const date = new Date('2026-01-20');
const dayOfWeek = date.toLocaleString('en-US', { weekday: 'LONG' }).toUpperCase();
const dayOfMonth = date.getDate();

// Check exception first
const exception = await prisma.availabilityException.findUnique({
  where: {
    barberId_date: {
      barberId: barberId,
      date: date
    }
  }
});

if (exception) {
  // Handle BLOCKED or SPECIAL
} else {
  // Check recurrence
  const availability = await prisma.barberAvailability.findMany({
    where: {
      barberId: barberId,
      isActive: true,
      OR: [
        { recurrenceType: 'DAILY' },
        { recurrenceType: 'WEEKLY', dayOfWeek: dayOfWeek },
        { recurrenceType: 'MONTHLY', dayOfMonth: dayOfMonth }
      ]
    }
  });
}
```

### Find available slots for a booking
```typescript
// 1. Get barber availability
// 2. Get service duration
// 3. Generate time slots (e.g., every 30 min)
// 4. For each slot, check if barberId + startTime has existing booking
// 5. Filter out conflicting slots
```
