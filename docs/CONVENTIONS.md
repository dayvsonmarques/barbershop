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

# Commit Conventions

## Format

```
<prefix>(<scope>): <short message>
```

## Rules

- Message must not exceed **12 words**
- Always include a **prefix** matching the change type
- No `Co-Authored-By` or any signature trailer
- Write in **English**

## Prefixes

| Prefix | Use when |
|---|---|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependencies |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |

## Examples

```
feat(blog): add 6 SEO posts for Q1 2026
fix(home): rewrite slider with transform-based navigation
chore(deps): update next to 15.3
docs(commits): add commit conventions guide
refactor(admin): split skills CRUD into smaller components
```

## Anti-patterns

```
# Too long (over 12 words)
feat(home): replace overflow-x scroll approach with CSS transform-based carousel navigation system

# Missing prefix
update slider navigation

# Has signature
fix(blog): correct post date format
```

