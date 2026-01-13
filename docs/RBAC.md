# RBAC (Role-Based Access Control)

## Overview
Role-Based Access Control system using groups and permissions for fine-grained authorization.

## Architecture

### Permission Model
```
User ←→ UserGroup ←→ Group ←→ GroupPermission ←→ Permission
```

- **User**: Can belong to multiple groups
- **Group**: Contains multiple users and has multiple permissions
- **Permission**: Defines access to a resource+action combination

### Permission Structure
```typescript
{
  resource: string,  // e.g., "users", "bookings", "services"
  action: string     // "view", "create", "update", "delete"
}
```

## Core Functions

### Check Permissions (`lib/rbac.ts`)

#### `hasPermission(userId, resource, action)`
Check if user has specific permission.

```typescript
const canEdit = await hasPermission(userId, "bookings", "update");
```

#### `getUserPermissions(userId)`
Get all permissions for a user.

```typescript
const permissions = await getUserPermissions(userId);
// Returns: [{ resource: "bookings", action: "view" }, ...]
```

#### `getUserGroups(userId)`
Get user's groups.

```typescript
const groups = await getUserGroups(userId);
// Returns: [{ id: 1, name: "Administrador", description: "..." }, ...]
```

#### `hasAnyPermission(userId, permissions[])`
Check if user has ANY of the permissions (OR logic).

```typescript
const canAccess = await hasAnyPermission(userId, [
  { resource: "bookings", action: "view" },
  { resource: "bookings", action: "create" }
]);
```

#### `hasAllPermissions(userId, permissions[])`
Check if user has ALL permissions (AND logic).

```typescript
const canManage = await hasAllPermissions(userId, [
  { resource: "users", action: "view" },
  { resource: "users", action: "update" }
]);
```

## Auth Guards (`lib/auth-guards.ts`)

Middleware functions that combine authentication and authorization.

### `requireAuth(request)`
Verify authentication only (no permission check).

```typescript
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  
  if (auth instanceof NextResponse) {
    return auth; // 401 error
  }
  
  // auth.userId and auth.email available
}
```

### `requirePermission(request, resource, action)`
Verify authentication + specific permission.

```typescript
export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "users", "delete");
  
  if (auth instanceof NextResponse) {
    return auth; // 401 or 403 error
  }
  
  // User has permission, proceed
}
```

### `requireAnyPermission(request, permissions[])`
Verify authentication + any permission (OR logic).

```typescript
export async function GET(request: NextRequest) {
  const auth = await requireAnyPermission(request, [
    { resource: "bookings", action: "view" },
    { resource: "bookings", action: "create" }
  ]);
  
  if (auth instanceof NextResponse) {
    return auth;
  }
  
  // User has at least one permission
}
```

### `requireAllPermissions(request, permissions[])`
Verify authentication + all permissions (AND logic).

```typescript
export async function POST(request: NextRequest) {
  const auth = await requireAllPermissions(request, [
    { resource: "settings", action: "view" },
    { resource: "settings", action: "update" }
  ]);
  
  if (auth instanceof NextResponse) {
    return auth;
  }
  
  // User has all required permissions
}
```

## API Routes

### GET `/api/auth/me`
Get current user info with groups and permissions.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "cuid123",
    "email": "admin@edbarbearia.com"
  },
  "groups": [
    {
      "id": 1,
      "name": "Administrador",
      "description": "Acesso total ao sistema"
    }
  ],
  "permissions": [
    { "resource": "users", "action": "view" },
    { "resource": "users", "action": "create" },
    { "resource": "bookings", "action": "view" }
  ]
}
```

### GET `/api/admin/users` (Example)
Protected route example requiring "users" + "view" permission.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "users": [
    {
      "id": "cuid123",
      "email": "admin@edbarbearia.com",
      "name": "Administrador",
      "isActive": true,
      "createdAt": "2026-01-13T10:00:00.000Z"
    }
  ]
}
```

**Response (403):**
```json
{
  "error": "Você não tem permissão para realizar esta ação"
}
```

## Usage Examples

### Protect API Route
```typescript
import { requirePermission } from "@/lib/auth-guards";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Require "bookings" + "create" permission
  const auth = await requirePermission(request as any, "bookings", "create");
  
  if (auth instanceof NextResponse) {
    return auth; // Error response (401 or 403)
  }
  
  // User authenticated and authorized
  // auth.userId and auth.email available
  
  // ... create booking logic
  
  return NextResponse.json({ success: true });
}
```

### Multiple Actions on Same Resource
```typescript
import { requireAnyPermission } from "@/lib/auth-guards";

export async function GET(request: Request) {
  // User needs view OR create permission on bookings
  const auth = await requireAnyPermission(request as any, [
    { resource: "bookings", action: "view" },
    { resource: "bookings", action: "create" }
  ]);
  
  if (auth instanceof NextResponse) {
    return auth;
  }
  
  // ... logic
}
```

### Check Permission in Service Layer
```typescript
import { hasPermission } from "@/lib/rbac";

async function deleteBooking(userId: string, bookingId: string) {
  // Check permission before proceeding
  if (!await hasPermission(userId, "bookings", "delete")) {
    throw new Error("Unauthorized");
  }
  
  // ... delete logic
}
```

## Default Groups (from seed)

### 1. Administrador
**Full access** - All 32 permissions (8 resources × 4 actions)

Resources: users, groups, barbers, services, bookings, products, courses, settings

### 2. Recepcionista
**Permissions:**
- bookings: view, create, update, delete
- barbers: view, create, update, delete
- services: view, create, update, delete
- products: view (read-only)

### 3. Barbeiro
**Permissions:**
- bookings: view (read-only)

## Permission Resources

Available resources in the system:
- `users` - User management
- `groups` - Group management
- `barbers` - Barber profiles
- `services` - Services and categories
- `bookings` - Appointment bookings
- `products` - Products and categories
- `courses` - Courses management
- `settings` - Establishment settings

## Security Best Practices

1. **Default Deny**
   - Always check permissions explicitly
   - Deny access if no permission found

2. **Check on Every Request**
   - Don't cache permissions client-side
   - Always verify server-side

3. **Principle of Least Privilege**
   - Grant minimum permissions needed
   - Review group permissions regularly

4. **Audit Trail** (Future)
   - Log permission checks
   - Track who did what and when

5. **UI/UX**
   - Hide UI elements user can't access
   - Show clear error messages for forbidden actions

## Client-Side Permission Check

For UI purposes only (not security):

```typescript
// Fetch user permissions on login
const response = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});

const { permissions } = await response.json();

// Check permission in component
function canEdit() {
  return permissions.some(
    p => p.resource === 'bookings' && p.action === 'update'
  );
}

// Conditionally render
{canEdit() && <button>Editar</button>}
```

**Important**: Always verify permissions server-side. Client-side checks are only for UX.

## Testing

### Test Credentials (from seed)
```
Admin:
  email: admin@edbarbearia.com
  password: password123
  permissions: ALL

Receptionist:
  email: recepcao@edbarbearia.com
  password: password123
  permissions: bookings*, barbers*, services*, products:view
```

### Test Permission Check
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edbarbearia.com","password":"password123"}'

# 2. Get user info (includes permissions)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# 3. Test protected route
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

- [ ] Permission caching (Redis)
- [ ] Dynamic permission registration
- [ ] Permission inheritance
- [ ] Resource-level permissions (e.g., "own bookings only")
- [ ] Temporary permission grants
- [ ] Permission audit log
- [ ] Admin UI for permission management
