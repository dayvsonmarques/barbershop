# Conventions

## Naming Standards
- **TypeScript:** 
  - Variables/functions: `camelCase`
  - Components/classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Routes/components:** English names only
- **UI strings:** pt-BR in i18n/messages file(s) or direct in components

## Database Conventions
- Prefer `snake_case` for column and table names
- Use Prisma `@map` / `@@map` if Prisma models use `PascalCase`/`camelCase`
- Example:
  ```prisma
  model ServiceCategory {
    id   Int    @id @default(autoincrement())
    name String
    
    @@map("service_categories")
  }
  ```

## Code Quality Principles
- **DRY** (Don't Repeat Yourself)
- **SOLID** principles
- **Separation of concerns**
- Server-side validation (Zod) for any write operation
- Default-deny authorization for admin routes/actions

## File Organization
- Group by feature/domain when possible
- Colocate related files (components, types, utils)
- Use barrel exports (`index.ts`) for clean imports
- Prefix private components with `_` (e.g., `_internal-component.tsx`)

## Testing (Minimum)
- Unit tests for Zod schemas
- Unit tests for availability/slot calculations
- Integration smoke tests for auth + RBAC gates
