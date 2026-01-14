# Performance Optimization Guide

## ✅ Current Optimizations

### Next.js App Router
- ✅ Server-side rendering (SSR) for dynamic content
- ✅ Static generation where possible
- ✅ Automatic code splitting
- ✅ Image optimization with next/image (when used)

### Database
- ✅ Indexed fields for common queries
- ✅ Unique constraints prevent duplicate queries
- ✅ Efficient query patterns with Prisma
- ✅ Select only required fields

### React Components
- ✅ Client components marked with "use client" only when needed
- ✅ Server components by default
- ✅ Minimal client-side JavaScript

## 🚀 Production Optimizations

### 1. Database Performance

#### Connection Pooling
```typescript
// Update prisma/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### Query Optimization
- Use `include` sparingly, prefer `select`
- Implement cursor-based pagination for large datasets
- Add composite indexes for complex queries
- Use database views for complex queries

```sql
-- Example: Index for booking conflicts check
CREATE INDEX idx_bookings_barber_scheduled 
ON bookings(barber_id, scheduled_at) 
WHERE status IN ('PENDING', 'CONFIRMED');
```

### 2. Caching Strategy

#### Static Pages
```typescript
// app/page.tsx - Home page
export const revalidate = 3600; // Revalidate every hour

export default async function HomePage() {
  // Cached for 1 hour
}
```

#### API Routes
```typescript
// Add caching headers
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
```

#### Redis for Session/Cache (Production)
```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

// Cache frequently accessed data
export async function getCachedServices() {
  const cached = await redis.get('services:active');
  if (cached) return JSON.parse(cached);

  const services = await prisma.service.findMany({ where: { isActive: true } });
  await redis.set('services:active', JSON.stringify(services), {
    EX: 300, // 5 minutes
  });

  return services;
}
```

### 3. Image Optimization

#### Next.js Image Component
```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  placeholder="blur"
  priority={false} // Only true for above-fold images
/>
```

#### CDN Configuration
- Use Vercel Image Optimization or Cloudinary
- Serve images from CDN
- Implement lazy loading for images below the fold

### 4. Code Splitting & Lazy Loading

#### Dynamic Imports
```typescript
import dynamic from 'next/dynamic';

const MapSection = dynamic(() => import('@/components/map-section'), {
  loading: () => <div>Loading map...</div>,
  ssr: false, // Don't render on server
});
```

#### Route-based Code Splitting
Already implemented via App Router automatically

### 5. Bundle Size Optimization

#### Analyze Bundle
```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run analysis:
```bash
ANALYZE=true npm run build
```

#### Tree Shaking
- Import only what you need: `import { specific } from 'library'`
- Avoid barrel exports in large libraries
- Use dynamic imports for heavy libraries

### 6. API Optimization

#### Batch Requests
```typescript
// Instead of multiple API calls
const [services, barbers, availability] = await Promise.all([
  fetch('/api/services'),
  fetch('/api/barbers'),
  fetch('/api/availability'),
]);
```

#### GraphQL (Future Consideration)
- Reduce over-fetching
- Client controls data shape
- Single request for multiple resources

### 7. Frontend Performance

#### React Best Practices
```typescript
// Use React.memo for expensive components
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Complex rendering logic
});

// Use useCallback for functions passed to children
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Use useMemo for expensive calculations
const sortedData = useMemo(() => 
  data.sort((a, b) => a.value - b.value),
  [data]
);
```

#### Debounce User Input
```typescript
import { useState, useEffect } from 'react';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### 8. Monitoring & Metrics

#### Web Vitals
```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

#### Custom Monitoring
- Log slow queries (> 1s)
- Track API response times
- Monitor error rates
- Alert on performance degradation

### 9. Production Checklist

#### Build Optimization
- [ ] Enable minification (default in Next.js)
- [ ] Enable compression (gzip/brotli)
- [ ] Remove console.logs in production
- [ ] Use production environment variables

#### Deployment
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2 or HTTP/3
- [ ] Configure proper cache headers
- [ ] Set up edge caching (Vercel/Cloudflare)

#### Database
- [ ] Create all necessary indexes
- [ ] Set up read replicas for heavy read workloads
- [ ] Configure connection pooling
- [ ] Enable query performance monitoring

## 📊 Performance Targets

### Page Load Times
- Home page: < 2s (3G)
- Admin pages: < 3s (3G)
- API responses: < 500ms

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Lighthouse Score
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

## 🔧 Performance Testing Tools

1. **Lighthouse** (Chrome DevTools)
   - Automated audits
   - Performance, accessibility, SEO

2. **WebPageTest**
   - Real browser testing
   - Waterfall analysis
   - Multiple locations

3. **GTmetrix**
   - Detailed performance reports
   - Historical tracking

4. **Chrome DevTools**
   - Network tab for request analysis
   - Performance profiler
   - Memory profiler

5. **Artillery** (Load Testing)
   ```bash
   npm install -g artillery
   artillery quick --count 100 --num 10 http://localhost:3000/api/services
   ```

## 🎯 Optimization Priority

### High Impact, Low Effort
1. Enable compression
2. Add cache headers
3. Optimize images
4. Defer non-critical JavaScript

### High Impact, Medium Effort
1. Implement database indexes
2. Add Redis caching
3. Optimize bundle size
4. Implement code splitting

### High Impact, High Effort
1. Migrate to edge functions
2. Implement full-text search
3. Add service workers/PWA
4. Implement GraphQL

### Continuous Improvement
- Regular performance audits
- Monitor real user metrics (RUM)
- A/B test performance optimizations
- Keep dependencies updated
