# Testing Guide

## Overview

This project uses Vitest for unit and integration testing, along with React Testing Library for component testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Unit Tests

#### Validations (`src/__tests__/validations.test.ts`)
Tests Zod schemas for:
- Service validations
- Barber validations
- Booking validations
- Product validations
- Course validations

#### Authentication & RBAC (`src/__tests__/auth-rbac.test.ts`)
Tests for:
- Password hashing and verification
- Permission checks
- Role-based access control
- Rate limiting

#### Business Logic (`src/__tests__/business-logic.test.ts`)
Tests for:
- Booking conflict detection
- Time slot generation
- Date validation
- Service duration calculations
- Day of week mapping

#### Security (`src/__tests__/security.test.ts`)
Tests for:
- Input validation patterns
- Security best practices
- Environment variable requirements
- XSS/SQL injection protection awareness

## Writing Tests

### Test File Naming
- Place tests in `src/__tests__/` directory
- Name files with `.test.ts` or `.test.tsx` extension
- Group related tests together

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { serviceSchema } from '@/lib/validations/services';

describe('Service Validations', () => {
  describe('serviceSchema', () => {
    it('should validate a valid service', () => {
      const validService = {
        categoryId: 1,
        name: 'Corte Masculino',
        duration: 30,
        price: 35.0,
        isActive: true,
      };

      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it('should reject invalid price', () => {
      const invalidService = {
        categoryId: 1,
        name: 'Corte',
        duration: 30,
        price: -10,
        isActive: true,
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });
  });
});
```

### Testing Async Functions

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';

describe('Password Hashing', () => {
  it('should hash and verify password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });
});
```

### Mocking

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('With Mocks', () => {
  it('should mock a function', () => {
    const mockFn = vi.fn(() => 'mocked value');
    
    expect(mockFn()).toBe('mocked value');
    expect(mockFn).toHaveBeenCalled();
  });

  it('should mock a module', async () => {
    vi.mock('@/lib/prisma', () => ({
      prisma: {
        service: {
          findMany: vi.fn(() => []),
        },
      },
    }));

    const { prisma } = await import('@/lib/prisma');
    const services = await prisma.service.findMany();

    expect(services).toEqual([]);
  });
});
```

## Test Coverage

Current test coverage:
- ✅ Validation schemas
- ✅ Authentication utilities
- ✅ RBAC helpers
- ✅ Business logic functions
- ✅ Security best practices

### Areas for Future Testing

#### Integration Tests
- API route handlers
- Database operations
- Email sending
- File uploads (if implemented)

#### E2E Tests (Future)
```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// e2e/booking.spec.ts
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  await page.goto('/agendar');
  
  await page.selectOption('#service', '1');
  await page.selectOption('#barber', '1');
  await page.fill('#date', '2026-02-15');
  await page.click('button:has-text("09:00")');
  await page.fill('#clientName', 'João Silva');
  await page.fill('#clientPhone', '(11) 99999-9999');
  
  await page.click('button:has-text("Confirmar")');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow "should..." pattern
- Be specific about what's being tested

### 2. AAA Pattern
```typescript
it('should do something', () => {
  // Arrange
  const input = 'test';
  
  // Act
  const result = someFunction(input);
  
  // Assert
  expect(result).toBe('expected');
});
```

### 3. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after tests if needed

### 4. Don't Test Implementation Details
```typescript
// ❌ Bad - tests implementation
it('should call setState with value', () => {
  const setState = vi.fn();
  // testing internals
});

// ✅ Good - tests behavior
it('should update displayed value', () => {
  // testing observable behavior
});
```

### 5. Use Factories for Test Data
```typescript
// test-utils/factories.ts
export const createMockService = (overrides = {}) => ({
  id: 1,
  name: 'Test Service',
  duration: 30,
  price: 50,
  isActive: true,
  ...overrides,
});

// In tests
const service = createMockService({ price: 100 });
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --run
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### VS Code Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug Single Test
```typescript
import { describe, it, expect } from 'vitest';

// Add .only to run just this test
it.only('should debug this test', () => {
  // Set breakpoint here
  expect(true).toBe(true);
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
