# Shop / Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete shop with product CRUD, public listing/detail pages, localStorage cart, and static PIX checkout.

**Architecture:** Next.js 15 App Router — server components for data/SEO, client components for interactivity. Prisma for DB access. Cart persisted in localStorage via React Context. PIX BR Code generated client-side from static key stored in EstablishmentSettings.

**Tech Stack:** Next.js 16, Prisma 7, Zod 4, sharp (image processing), qrcode.react (QR code), @hello-pangea/dnd (drag-and-drop reorder)

---

## File Map

### New files
```
src/lib/slug.ts
src/lib/pix.ts
src/lib/validations/checkout.ts
src/contexts/cart-context.tsx
src/components/product-card.tsx
src/components/products-carousel.tsx
src/app/produtos/page.tsx
src/app/produtos/[slug]/page.tsx
src/app/produtos/[slug]/_components/product-detail.tsx
src/app/checkout/page.tsx
src/app/api/public/products/route.ts
src/app/api/public/products/[slug]/route.ts
src/app/api/public/checkout/route.ts
src/app/api/admin/products/[id]/route.ts
src/app/api/admin/upload/product-image/route.ts
src/app/api/admin/orders/route.ts
src/app/api/admin/orders/[id]/route.ts
src/app/admin/(protected)/products/new/page.tsx
src/app/admin/(protected)/products/[id]/edit/page.tsx
src/app/admin/(protected)/products/_components/product-form.tsx
src/app/admin/(protected)/orders/page.tsx
src/__tests__/lib/slug.test.ts
src/__tests__/lib/pix.test.ts
src/__tests__/lib/validations/products.test.ts
public/uploads/products/.gitkeep
```

### Modified files
```
prisma/schema.prisma
prisma/seed.ts
src/lib/validations/products-courses.ts
src/app/layout.tsx
src/app/page.tsx
src/components/navbar.tsx
src/app/admin/(protected)/products/page.tsx
src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx
```

---

## Task 1: Schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update Product model** — replace `imageUrl` with `slug`, `discountPrice`, and `images` relation

Open `prisma/schema.prisma`. Replace the entire `Product` model:

```prisma
model Product {
  id            Int              @id @default(autoincrement())
  categoryId    Int
  name          String
  slug          String           @unique
  description   String?          @db.Text
  price         Decimal          @db.Decimal(10, 2)
  discountPrice Decimal?         @db.Decimal(10, 2)
  stock         Int              @default(0)
  isActive      Boolean          @default(true)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  category      ProductCategory  @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  images        ProductImage[]
  orderItems    OrderItem[]

  @@map("products")
}
```

- [ ] **Step 2: Add ProductImage model** — insert after the Product model block

```prisma
model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  url       String
  position  Int      @default(0)
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}
```

- [ ] **Step 3: Add Order, OrderItem models and OrderStatus enum** — insert after ProductImage

```prisma
enum OrderStatus {
  PENDING
  PAID
  CANCELLED
}

model Order {
  id            Int         @id @default(autoincrement())
  customerName  String
  customerPhone String
  total         Decimal     @db.Decimal(10, 2)
  status        OrderStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  items         OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  productId Int
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)

  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@map("order_items")
}
```

- [ ] **Step 4: Add pixKey to EstablishmentSettings** — add field inside the model

```prisma
pixKey    String?
```

- [ ] **Step 5: Run migration**

```bash
npx prisma migrate dev --name add_shop_features
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add product images, orders schema and PIX key field"
```

---

## Task 2: Slug utility + updated Zod validations

**Files:**
- Create: `src/lib/slug.ts`
- Create: `src/__tests__/lib/slug.test.ts`
- Modify: `src/lib/validations/products-courses.ts`
- Create: `src/__tests__/lib/validations/products.test.ts`

- [ ] **Step 1: Write failing slug tests**

Create `src/__tests__/lib/slug.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(generateSlug("Pomada Modeladora")).toBe("pomada-modeladora");
  });

  it("strips accents", () => {
    expect(generateSlug("Óleo para Barba")).toBe("oleo-para-barba");
  });

  it("removes special characters", () => {
    expect(generateSlug("Shampoo & Condicionador!")).toBe("shampoo-condicionador");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("a  --  b")).toBe("a-b");
  });

  it("trims leading/trailing whitespace", () => {
    expect(generateSlug("  pomada  ")).toBe("pomada");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/lib/slug.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/slug'`

- [ ] **Step 3: Implement slug utility**

Create `src/lib/slug.ts`:

```ts
export function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/lib/slug.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Write failing validation tests**

Create `src/__tests__/lib/validations/products.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { productSchema } from "@/lib/validations/products-courses";

describe("productSchema", () => {
  const valid = {
    name: "Pomada Forte",
    slug: "pomada-forte",
    categoryId: 1,
    price: 45.0,
    stock: 10,
    isActive: true,
    images: [{ url: "/uploads/products/abc.webp", position: 0, isPrimary: true }],
  };

  it("accepts valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects slug with uppercase", () => {
    expect(productSchema.safeParse({ ...valid, slug: "Pomada-Forte" }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(productSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });

  it("accepts null discountPrice", () => {
    expect(productSchema.safeParse({ ...valid, discountPrice: null }).success).toBe(true);
  });

  it("rejects discountPrice higher than price", () => {
    const result = productSchema.safeParse({ ...valid, discountPrice: 50.0 });
    expect(result.success).toBe(false);
  });

  it("defaults images to empty array", () => {
    const result = productSchema.safeParse({ ...valid, images: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.images).toEqual([]);
  });
});
```

- [ ] **Step 6: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/lib/validations/products.test.ts
```

Expected: FAIL — schema doesn't have `slug`, `discountPrice`, `images` yet.

- [ ] **Step 7: Update productSchema**

Replace the contents of `src/lib/validations/products-courses.ts`:

```ts
import { z } from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const productImageSchema = z.object({
  url: z.string().min(1, "URL obrigatória"),
  position: z.number().int().min(0),
  isPrimary: z.boolean(),
});

export const productSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
    slug: z
      .string()
      .min(1, "Slug obrigatório")
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
    description: z.string().max(5000).optional().nullable(),
    categoryId: z.number().int().positive("Categoria inválida"),
    price: z.number().min(0.01, "Preço deve ser positivo"),
    discountPrice: z.number().min(0.01).optional().nullable(),
    stock: z.number().int().min(0, "Estoque não pode ser negativo").default(0),
    isActive: z.boolean().default(true),
    images: z.array(productImageSchema).default([]),
  })
  .refine(
    (d) => d.discountPrice == null || d.discountPrice < d.price,
    { message: "Preço com desconto deve ser menor que o preço original", path: ["discountPrice"] }
  );

export const courseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  type: z.enum(["PRESENCIAL", "ONLINE"]),
  durationHours: z.number().int().min(1, "Duração mínima: 1 hora").max(1000),
  price: z.number().min(0, "Preço deve ser positivo"),
  isActive: z.boolean().default(true),
});

export type ProductCategoryInput = z.infer<typeof productCategorySchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
```

- [ ] **Step 8: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/lib/validations/products.test.ts src/__tests__/lib/slug.test.ts
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/slug.ts src/lib/validations/products-courses.ts src/__tests__/lib/slug.test.ts src/__tests__/lib/validations/products.test.ts
git commit -m "feat(db): add slug utility and update product Zod schema"
```

---

## Task 3: Image upload API

**Files:**
- Create: `src/app/api/admin/upload/product-image/route.ts`
- Create: `public/uploads/products/.gitkeep`

- [ ] **Step 1: Install sharp**

```bash
npm install sharp
npm install --save-dev @types/node
```

Expected: added to `package.json`.

- [ ] **Step 2: Create upload directory**

```bash
mkdir -p public/uploads/products
touch public/uploads/products/.gitkeep
```

- [ ] **Step 3: Create upload route**

Create `src/app/api/admin/upload/product-image/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products");

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "products", "create");
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Invalid type. Allowed: JPEG, PNG, WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const filepath = join(UPLOAD_DIR, filename);

  await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(filepath);

  return NextResponse.json({ url: `/uploads/products/${filename}` });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "products", "delete");
  if (auth instanceof NextResponse) return auth;

  const filePath = new URL(request.url).searchParams.get("file") ?? "";

  if (!filePath.startsWith("/uploads/products/") || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    await unlink(join(process.cwd(), "public", filePath));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

- [ ] **Step 4: Verify build passes**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/upload/ public/uploads/products/.gitkeep package.json package-lock.json
git commit -m "feat(admin): add product image upload API with sharp processing"
```

---

## Task 4: Admin products CRUD API

**Files:**
- Modify: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: Update POST /api/admin/products to handle images**

Replace `src/app/api/admin/products/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { productSchema } from "@/lib/validations/products-courses";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "products", "view");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const products = await prisma.product.findMany({
    where: categoryId ? { categoryId: parseInt(categoryId, 10) } : {},
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "products", "create");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const validation = productSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { images, ...productData } = validation.data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      images: { create: images },
    },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json(product, { status: 201 });
}
```

- [ ] **Step 2: Create GET/PUT/DELETE /api/admin/products/[id]/route.ts**

Create `src/app/api/admin/products/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { productSchema } from "@/lib/validations/products-courses";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "view");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "update");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const validation = productSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { images, ...productData } = validation.data;

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          images: { create: images },
        },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      });
    });
    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "delete");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/products/
git commit -m "feat(admin): add full product CRUD API with image support"
```

---

## Task 5: Seeds — 12 products

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add new category and 12 products to seed.ts**

In `prisma/seed.ts`, after the existing product categories block (after `beardOilCategory`), add:

```ts
  const shampooCategory = await prisma.productCategory.create({
    data: {
      name: "Shampoos e Condicionadores",
      description: "Shampoos e condicionadores para cabelo e barba",
    },
  });
```

Then replace the `prisma.product.createMany` call with individual `create` calls that include images. Replace the entire products section (from the `await prisma.product.createMany` call) with:

```ts
  const products = [
    // Pomadas (4 products, 2 with discount)
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Modeladora Extra Forte",
      slug: "pomada-modeladora-extra-forte",
      description: "Fixação extra forte para looks definidos e duradouros. Fórmula sem álcool.",
      price: 49.90,
      discountPrice: 39.90,
      stock: 20,
      images: [
        { url: "https://picsum.photos/seed/pomada1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/pomada1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/pomada1c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Brilho Natural",
      slug: "pomada-brilho-natural",
      description: "Brilho intenso com fixação média. Ideal para cabelos lisos.",
      price: 44.90,
      discountPrice: null,
      stock: 15,
      images: [
        { url: "https://picsum.photos/seed/pomada2a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/pomada2b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/pomada2c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Matte Opaco",
      slug: "pomada-matte-opaco",
      description: "Acabamento matte sem brilho para looks naturais e modernos.",
      price: 42.90,
      discountPrice: 34.90,
      stock: 18,
      images: [
        { url: "https://picsum.photos/seed/pomada3a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/pomada3b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/pomada3c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Cera Modeladora Flexível",
      slug: "cera-modeladora-flexivel",
      description: "Fixação flexível para retoques ao longo do dia. Fórmula leve.",
      price: 38.90,
      discountPrice: null,
      stock: 25,
      images: [
        { url: "https://picsum.photos/seed/cera1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/cera1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/cera1c/800/800", position: 2, isPrimary: false },
      ],
    },
    // Óleos para Barba (4 products, 2 with discount)
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Cedarwood",
      slug: "oleo-para-barba-cedarwood",
      description: "Aroma amadeirado intenso. Hidrata e amacia a barba com óleo de argan.",
      price: 59.90,
      discountPrice: 49.90,
      stock: 12,
      images: [
        { url: "https://picsum.photos/seed/oleo1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/oleo1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/oleo1c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Citrus Fresh",
      slug: "oleo-para-barba-citrus-fresh",
      description: "Aroma cítrico refrescante com notas de bergamota e limão.",
      price: 55.90,
      discountPrice: null,
      stock: 10,
      images: [
        { url: "https://picsum.photos/seed/oleo2a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/oleo2b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/oleo2c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Vanilla Musk",
      slug: "oleo-para-barba-vanilla-musk",
      description: "Combinação suave de baunilha e almíscar. Hidratação profunda.",
      price: 57.90,
      discountPrice: 45.90,
      stock: 8,
      images: [
        { url: "https://picsum.photos/seed/oleo3a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/oleo3b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/oleo3c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Bálsamo Hidratante para Barba",
      slug: "balsamo-hidratante-para-barba",
      description: "Bálsamo leave-in para controle e hidratação da barba longa.",
      price: 52.90,
      discountPrice: null,
      stock: 14,
      images: [
        { url: "https://picsum.photos/seed/balsamo1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/balsamo1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/balsamo1c/800/800", position: 2, isPrimary: false },
      ],
    },
    // Shampoos e Condicionadores (4 products, 1 with discount)
    {
      categoryId: shampooCategory.id,
      name: "Shampoo Anticaspa Mentolado",
      slug: "shampoo-anticaspa-mentolado",
      description: "Controle eficaz da caspa com sensação refrescante de menta.",
      price: 36.90,
      discountPrice: 28.90,
      stock: 22,
      images: [
        { url: "https://picsum.photos/seed/shampoo1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/shampoo1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/shampoo1c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Shampoo Fortalecedor com Biotina",
      slug: "shampoo-fortalecedor-com-biotina",
      description: "Biotina e queratina para cabelos mais fortes e com menos queda.",
      price: 42.90,
      discountPrice: null,
      stock: 18,
      images: [
        { url: "https://picsum.photos/seed/shampoo2a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/shampoo2b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/shampoo2c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Condicionador Nutritivo de Argan",
      slug: "condicionador-nutritivo-de-argan",
      description: "Óleo de argan marroquino para cabelos macios e sem frizz.",
      price: 39.90,
      discountPrice: null,
      stock: 16,
      images: [
        { url: "https://picsum.photos/seed/cond1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/cond1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/cond1c/800/800", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Kit Shampoo + Condicionador Barba",
      slug: "kit-shampoo-condicionador-barba",
      description: "Kit completo para higiene e cuidado da barba. Uso diário.",
      price: 79.90,
      discountPrice: null,
      stock: 9,
      images: [
        { url: "https://picsum.photos/seed/kit1a/800/800", position: 0, isPrimary: true },
        { url: "https://picsum.photos/seed/kit1b/800/800", position: 1, isPrimary: false },
        { url: "https://picsum.photos/seed/kit1c/800/800", position: 2, isPrimary: false },
      ],
    },
  ];

  for (const { images, discountPrice, ...data } of products) {
    await prisma.product.create({
      data: {
        ...data,
        discountPrice: discountPrice ?? undefined,
        images: { create: images },
      },
    });
  }
```

Also add `pixKey` to the `establishmentSettings.create` call:
```ts
pixKey: "edmilson.barbearia7@gmail.com",
```

- [ ] **Step 2: Remove old createMany call**

Delete the original `await prisma.product.createMany({ data: [...] })` block (the one with "Pomada Modeladora Forte", "Pomada Brilho Natural", "Óleo para Barba Cedarwood").

- [ ] **Step 3: Reset DB and run seed**

```bash
npm run db:reset
```

Expected: `✅ Seed completed successfully!`

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(db): seed 12 products with images and discount prices"
```

---

## Task 6: Admin products list page

**Files:**
- Modify: `src/app/admin/(protected)/products/page.tsx`

- [ ] **Step 1: Rewrite the products list page**

Replace `src/app/admin/(protected)/products/page.tsx` entirely:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";

type ProductImage = { url: string; isPrimary: boolean };

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  category: { id: number; name: string };
  images: ProductImage[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Desativar "${name}"?`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="mt-1 text-sm text-gray-600">{products.length} produtos cadastrados</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Produto
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Produto", "Categoria", "Preço", "Estoque", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map((p) => {
              const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
              const discount = p.discountPrice
                ? Math.round((1 - p.discountPrice / p.price) * 100)
                : null;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
                        {primary ? (
                          <Image src={primary.url} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300 text-xs">—</div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.category.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        R$ {Number(p.discountPrice ?? p.price).toFixed(2).replace(".", ",")}
                      </span>
                      {discount && (
                        <span className="rounded bg-[#FDF8EE] px-1.5 py-0.5 text-xs font-semibold text-[#C9A84C]">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-[#C9A84C] hover:text-[#A07830] mr-4">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:text-red-900">
                      Desativar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum produto cadastrado</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders without errors**

Start dev server: `npm run dev` and navigate to `http://localhost:3000/admin/products`. Confirm product list appears with thumbnails and discount badges.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/products/page.tsx
git commit -m "feat(admin): rewrite products list with thumbnails and discount badges"
```

---

## Task 7: Admin product form (new + edit pages)

**Files:**
- Create: `src/app/admin/(protected)/products/_components/product-form.tsx`
- Create: `src/app/admin/(protected)/products/new/page.tsx`
- Create: `src/app/admin/(protected)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Install @hello-pangea/dnd**

```bash
npm install @hello-pangea/dnd
npm install --save-dev @types/hello-pangea__dnd
```

- [ ] **Step 2: Create shared ProductForm component**

Create `src/app/admin/(protected)/products/_components/product-form.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { generateSlug } from "@/lib/slug";

type ProductImage = { url: string; position: number; isPrimary: boolean };

type FormState = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  isActive: boolean;
  images: ProductImage[];
};

type Category = { id: number; name: string };

type Props = {
  productId?: number;
  initialData?: Partial<FormState & { images: ProductImage[] }>;
};

export function ProductForm({ productId, initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    categoryId: initialData?.categoryId ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price ?? "",
    discountPrice: initialData?.discountPrice ?? "",
    stock: initialData?.stock ?? "0",
    isActive: initialData?.isActive ?? true,
    images: initialData?.images ?? [],
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.data ?? []));
  }, []);

  function set(field: keyof FormState, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (!productId) set("slug", generateSlug(value));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload/product-image", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Upload failed");
          continue;
        }
        const { url } = await res.json();
        setForm((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { url, position: prev.images.length, isPrimary: prev.images.length === 0 },
          ],
        }));
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveImage(url: string) {
    await fetch(`/api/admin/upload/product-image?file=${encodeURIComponent(url)}`, { method: "DELETE" });
    setForm((prev) => {
      const remaining = prev.images
        .filter((i) => i.url !== url)
        .map((i, idx) => ({ ...i, position: idx }));
      if (remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      return { ...prev, images: remaining };
    });
  }

  function setPrimary(url: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((i) => ({ ...i, isPrimary: i.url === url })),
    }));
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(form.images);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setForm((prev) => ({ ...prev, images: items.map((i, idx) => ({ ...i, position: idx })) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        categoryId: parseInt(form.categoryId, 10),
        description: form.description || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stock: parseInt(form.stock, 10),
        isActive: form.isActive,
        images: form.images,
      };

      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar");
        return;
      }

      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Nome + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            className={inputClass}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            pattern="[a-z0-9-]+"
            title="Apenas letras minúsculas, números e hífens"
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className={labelClass}>Categoria *</label>
        <select
          className={inputClass}
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          className={inputClass}
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={5000}
        />
      </div>

      {/* Preço + Desconto + Estoque */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Preço (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Preço c/ desconto (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.discountPrice}
            onChange={(e) => set("discountPrice", e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className={labelClass}>Estoque</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#C9A84C]"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">Produto ativo (visível na loja)</label>
      </div>

      {/* Imagens */}
      <div>
        <label className={labelClass}>Imagens</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mb-3 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "+ Adicionar imagens"}
        </button>
        <p className="text-xs text-gray-500 mb-3">JPEG, PNG ou WebP · máx 5 MB · arraste para reordenar · ★ = imagem principal</p>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-3"
              >
                {form.images.map((img, idx) => (
                  <Draggable key={img.url} draggableId={img.url} index={idx}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className="relative group"
                      >
                        <div className={`relative h-24 w-24 overflow-hidden rounded border-2 ${img.isPrimary ? "border-[#C9A84C]" : "border-gray-200"}`}>
                          <Image src={img.url} alt="" fill className="object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimary(img.url)}
                          title="Marcar como principal"
                          className={`absolute top-1 left-1 text-xs ${img.isPrimary ? "text-[#C9A84C]" : "text-white opacity-0 group-hover:opacity-100"}`}
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.url)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#C9A84C] px-6 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50"
        >
          {saving ? "Salvando..." : productId ? "Salvar alterações" : "Criar produto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create new product page**

Create `src/app/admin/(protected)/products/new/page.tsx`:

```tsx
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductForm } from "../_components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
        <p className="mt-1 text-sm text-gray-600">Preencha os dados do produto</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create edit product page**

Create `src/app/admin/(protected)/products/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductForm } from "../../_components/product-form";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct({
          name: data.name,
          slug: data.slug,
          categoryId: String(data.categoryId),
          description: data.description ?? "",
          price: String(data.price),
          discountPrice: data.discountPrice ? String(data.discountPrice) : "",
          stock: String(data.stock),
          isActive: data.isActive,
          images: data.images,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  if (!product) return <div className="p-6 text-red-600">Produto não encontrado</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
        <p className="mt-1 text-sm text-gray-600">Altere os dados do produto</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm productId={parseInt(id, 10)} initialData={product} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Check categories API exists**

```bash
ls src/app/api/admin/categories/
```

If the file `route.ts` exists, confirm it returns `{ id, name }` objects. The form calls `/api/admin/categories` to populate the select.

- [ ] **Step 6: Test the form in browser**

Navigate to `http://localhost:3000/admin/products/new`. Confirm:
- Slug auto-generates as you type the name
- File upload works, shows preview
- Drag-and-drop reorders images
- Star marks primary image
- Submit creates product and redirects to list

- [ ] **Step 7: Commit**

```bash
git add "src/app/admin/(protected)/products/"
git commit -m "feat(admin): implement full product CRUD with edit pages"
```

---

## Task 8: Public products API

**Files:**
- Create: `src/app/api/public/products/route.ts`
- Create: `src/app/api/public/products/[slug]/route.ts`

- [ ] **Step 1: Create GET /api/public/products**

Create `src/app/api/public/products/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const limit = searchParams.get("limit");

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId: parseInt(categoryId, 10) } : {}),
      },
      take: limit ? parseInt(limit, 10) : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create GET /api/public/products/[slug]**

Create `src/app/api/public/products/[slug]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { position: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/products/
git commit -m "feat(shop): add public products API routes"
```

---

## Task 9: ProductCard + /produtos listing + navbar link + home carousel

**Files:**
- Create: `src/components/product-card.tsx`
- Create: `src/app/produtos/page.tsx`
- Create: `src/components/products-carousel.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Create ProductCard component**

Create `src/components/product-card.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  primaryImageUrl: string | null;
};

export function ProductCard({ name, slug, price, discountPrice, primaryImageUrl }: Props) {
  const displayPrice = discountPrice ?? price;
  const discountPct = discountPrice ? Math.round((1 - discountPrice / price) * 100) : null;

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Link href={`/produtos/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-background-tertiary border border-border mb-3">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-border">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        )}
        {discountPct && (
          <span className="absolute top-2 left-2 bg-gold text-background-primary text-xs font-bold px-2 py-0.5">
            -{discountPct}%
          </span>
        )}
      </div>
      <h3 className="text-text-primary text-sm font-medium leading-snug mb-1 line-clamp-2">{name}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-gold font-semibold text-sm">R$ {fmt(displayPrice)}</span>
        {discountPrice && (
          <span className="text-text-secondary text-xs line-through">R$ {fmt(price)}</span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create /produtos listing page**

Create `src/app/produtos/page.tsx`:

```tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";

async function getData(categoryId?: string) {
  const [categories, products] = await Promise.all([
    prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId: parseInt(categoryId, 10) } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
  ]);
  return { categories, products };
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { categories, products } = await getData(category);

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionLabel label="Loja" />
        <h1
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Produtos
        </h1>
        <p className="text-text-secondary text-lg mb-10">
          Pomadas, óleos e produtos de qualidade profissional.
        </p>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <a
            href="/produtos"
            className={`px-4 py-1.5 text-sm border transition-colors ${!category ? "border-gold bg-gold text-background-primary" : "border-border text-text-secondary hover:border-gold hover:text-gold"}`}
          >
            Todos
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/produtos?category=${c.id}`}
              className={`px-4 py-1.5 text-sm border transition-colors ${category === String(c.id) ? "border-gold bg-gold text-background-primary" : "border-border text-text-secondary hover:border-gold hover:text-gold"}`}
            >
              {c.name}
            </a>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-text-secondary py-12 text-center">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                primaryImageUrl={p.images[0]?.url ?? null}
              />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Create ProductsCarousel component**

Create `src/components/products-carousel.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { ProductCard } from "@/components/product-card";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string; isPrimary: boolean }[];
};

export function ProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/products?limit=8")
      .then((r) => r.json())
      .then((json) => setProducts(json.data ?? []));
  }, []);

  function scroll(dir: "left" | "right") {
    if (!trackRef.current) return;
    const w = trackRef.current.offsetWidth;
    trackRef.current.scrollBy({ left: dir === "right" ? w * 0.75 : -w * 0.75, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Loja" />
        <div className="flex items-end justify-between mb-12">
          <h2
            className="font-heading text-text-primary"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
          >
            Produtos em destaque
          </h2>
          <Link href="/produtos" className="text-gold text-sm hover:underline hidden md:block">
            Ver todos →
          </Link>
        </div>

        <div className="relative">
          {/* Prev/Next buttons */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center bg-background-primary border border-border text-text-primary hover:text-gold transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center bg-background-primary border border-border text-text-primary hover:text-gold transition-colors"
            aria-label="Próximo"
          >
            ›
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:overflow-visible"
            style={{ scrollbarWidth: "none" }}
          >
            {products.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[calc(50%-8px)] md:w-auto">
                <ProductCard
                  name={p.name}
                  slug={p.slug}
                  price={Number(p.price)}
                  discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                  primaryImageUrl={p.images[0]?.url ?? null}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/produtos" className="text-gold text-sm hover:underline">Ver todos →</Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add carousel to home page**

In `src/app/page.tsx`, add the import and insert `<ProductsCarousel />` between `<InstagramFeed />` and `<MapSection />`:

```tsx
import { ProductsCarousel } from "@/components/products-carousel";
// ...
      <ScrollReveal>
        <InstagramFeed />
      </ScrollReveal>
      <ScrollReveal>
        <ProductsCarousel />
      </ScrollReveal>
      <MapSection />
```

- [ ] **Step 5: Add "Produtos" to navbar**

In `src/components/navbar.tsx`, add to the `navLinks` array:

```ts
{ href: "/produtos", label: "Produtos" },
```

Add it after `{ href: "#servicos", label: "Serviços" }`.

- [ ] **Step 6: Test in browser**

Navigate to `http://localhost:3000`. Confirm carousel appears. Navigate to `http://localhost:3000/produtos`. Confirm grid and category filter work.

- [ ] **Step 7: Commit**

```bash
git add src/components/product-card.tsx src/components/products-carousel.tsx src/app/produtos/page.tsx src/app/page.tsx src/components/navbar.tsx
git commit -m "feat(shop): add product carousel to home and listing page"
```

---

## Task 10: Product detail page /produtos/[slug]

**Files:**
- Create: `src/app/produtos/[slug]/page.tsx`
- Create: `src/app/produtos/[slug]/_components/product-detail.tsx`

- [ ] **Step 1: Create ProductDetail client component**

Create `src/app/produtos/[slug]/_components/product-detail.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/calendar-icon";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/contexts/cart-context";

type ProductImage = { id: number; url: string; position: number; isPrimary: boolean };

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  category: { id: number; name: string };
  images: ProductImage[];
};

type RelatedProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string; isPrimary: boolean }[];
};

type Props = { product: Product; related: RelatedProduct[] };

export function ProductDetail({ product, related }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(
    product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null
  );
  const [qty, setQty] = useState(1);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const effectivePrice = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null;

  function cartPayload() {
    return {
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      imageUrl: activeImage?.url ?? "",
    };
  }

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addItem(cartPayload());
  }

  function handleBuyNow() {
    for (let i = 0; i < qty; i++) addItem(cartPayload());
    router.push("/checkout");
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-8">
        <Link href="/" className="hover:text-gold">Início</Link>
        {" / "}
        <Link href="/produtos" className="hover:text-gold">Produtos</Link>
        {" / "}
        <span className="text-text-primary">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden bg-background-tertiary border border-border mb-3">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-opacity duration-200"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-border">Sem imagem</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden border-2 transition-colors ${activeImage?.id === img.id ? "border-gold" : "border-border hover:border-gold/50"}`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="text-gold text-xs tracking-widest uppercase mb-2">{product.category.name}</p>
          <h1 className="font-heading text-text-primary mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            {discountPct ? (
              <>
                <span className="text-gold font-semibold text-3xl">R$ {fmt(effectivePrice)}</span>
                <span className="text-text-secondary text-lg line-through">R$ {fmt(product.price)}</span>
                <span className="bg-gold text-background-primary text-xs font-bold px-2 py-0.5">-{discountPct}%</span>
              </>
            ) : (
              <span className="text-gold font-semibold text-3xl">R$ {fmt(effectivePrice)}</span>
            )}
          </div>

          {product.description && (
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{product.description}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-text-secondary text-sm">Quantidade:</span>
            <div className="flex items-center border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-text-primary hover:text-gold transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 text-text-primary min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 text-text-primary hover:text-gold transition-colors"
                disabled={qty >= product.stock}
              >
                +
              </button>
            </div>
            <span className="text-text-secondary text-xs">{product.stock} em estoque</span>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" onClick={handleAddToCart} className="flex-1">
              Adicionar ao Carrinho
            </Button>
            <Button variant="outline" size="lg" onClick={handleBuyNow} className="flex-1">
              Comprar Agora
            </Button>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="font-heading text-text-primary text-2xl mb-8">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                primaryImageUrl={p.images[0]?.url ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create server page with metadata**

Create `src/app/produtos/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductDetail } from "./_components/product-detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
  if (!product) return {};
  return {
    title: `${product.name} | ED Barbearia`,
    description: product.description?.slice(0, 160) ?? product.name,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  const serialized = {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  };

  const serializedRelated = related.map((p) => ({
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
  }));

  return (
    <>
      <Navbar />
      <ProductDetail product={serialized} related={serializedRelated} />
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Test detail page**

Navigate to `http://localhost:3000/produtos/pomada-modeladora-extra-forte`. Confirm:
- Gallery thumbnail click switches main image
- Quantity +/− works
- "Adicionar ao Carrinho" and "Comprar Agora" buttons are visible (cart doesn't work yet — Task 11)

- [ ] **Step 4: Commit**

```bash
git add "src/app/produtos/"
git commit -m "feat(shop): implement product detail page with image gallery"
```

---

## Task 11: Cart context + navbar cart icon

**Files:**
- Create: `src/contexts/cart-context.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Create CartContext**

Create `src/contexts/cart-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ed-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: number, qty: number) {
    if (qty < 1) { removeItem(productId); return; }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  }

  function clearCart() { setItems([]); }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap root layout with CartProvider**

In `src/app/layout.tsx`, add the import and wrap `ThemeProvider`:

```tsx
import { CartProvider } from "@/contexts/cart-context";

// inside <body>:
<ThemeProvider>
  <CartProvider>
    {children}
  </CartProvider>
</ThemeProvider>
```

- [ ] **Step 3: Add cart icon to navbar**

In `src/components/navbar.tsx`:

1. Add import at the top:
```tsx
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
```

2. Inside the `Navbar` function, add:
```tsx
const { totalItems } = useCart();
```

3. Add cart icon button in the right-side `<div className="flex items-center gap-4 ml-auto">`, before `<ThemeToggle />`:

```tsx
<Link href="/checkout" className="relative hidden md:flex items-center text-text-primary hover:text-gold transition-colors" aria-label="Carrinho">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
  </svg>
  {totalItems > 0 && (
    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-background-primary text-[10px] font-bold">
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  )}
</Link>
```

- [ ] **Step 4: Test cart flow**

Navigate to a product detail page, click "Adicionar ao Carrinho". Confirm the badge appears in the navbar with count 1. Add more items — badge updates.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/cart-context.tsx src/app/layout.tsx src/components/navbar.tsx
git commit -m "feat(cart): add localStorage cart context and navbar badge"
```

---

## Task 12: PIX utility + checkout API

**Files:**
- Create: `src/lib/pix.ts`
- Create: `src/__tests__/lib/pix.test.ts`
- Create: `src/lib/validations/checkout.ts`
- Create: `src/app/api/public/checkout/route.ts`

- [ ] **Step 1: Write failing PIX tests**

Create `src/__tests__/lib/pix.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generatePixCode } from "@/lib/pix";

describe("generatePixCode", () => {
  const params = {
    pixKey: "edmilson@example.com",
    merchantName: "ED Barbearia",
    merchantCity: "Recife",
    amount: 49.90,
  };

  it("starts with payload format indicator 000201", () => {
    expect(generatePixCode(params)).toMatch(/^000201/);
  });

  it("contains the PIX key", () => {
    expect(generatePixCode(params)).toContain("edmilson@example.com");
  });

  it("contains the merchant name", () => {
    expect(generatePixCode(params)).toContain("ED Barbearia");
  });

  it("contains the amount formatted with 2 decimal places", () => {
    expect(generatePixCode(params)).toContain("49.90");
  });

  it("ends with 4-char uppercase hex CRC after 6304", () => {
    const code = generatePixCode(params);
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("produces a string of reasonable length", () => {
    const code = generatePixCode(params);
    expect(code.length).toBeGreaterThan(80);
    expect(code.length).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/__tests__/lib/pix.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/pix'`

- [ ] **Step 3: Implement PIX BR Code generator**

Create `src/lib/pix.ts`:

```ts
function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixCode({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId = "***",
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
}): string {
  const gui = tlv("00", "BR.GOV.BCB.PIX");
  const key = tlv("01", pixKey);
  const merchantAccount = tlv("26", gui + key);

  const txIdField = tlv("05", txId.slice(0, 25));
  const additionalData = tlv("62", txIdField);

  const body = [
    tlv("00", "01"),
    merchantAccount,
    tlv("52", "0000"),
    tlv("53", "986"),
    tlv("54", amount.toFixed(2)),
    tlv("58", "BR"),
    tlv("59", merchantName.slice(0, 25).padEnd(1)),
    tlv("60", merchantCity.slice(0, 15).padEnd(1)),
    additionalData,
    "6304",
  ].join("");

  return body + crc16(body);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/lib/pix.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Create checkout validation schema**

Create `src/lib/validations/checkout.ts`:

```ts
import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome obrigatório").max(100),
  customerPhone: z.string().min(8, "Telefone inválido").max(20),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .min(1, "Carrinho vazio"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
```

- [ ] **Step 6: Create checkout API route**

Create `src/app/api/public/checkout/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = checkoutSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { customerName, customerPhone, items } = validation.data;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  // Validate each item
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produto ${item.productId} não encontrado` },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${product.name}"` },
        { status: 400 }
      );
    }
  }

  const total = items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId)!;
    return sum + Number(p.discountPrice ?? p.price) * item.quantity;
  }, 0);

  const settings = await prisma.establishmentSettings.findUnique({ where: { id: 1 } });

  const order = await prisma.order.create({
    data: {
      customerName,
      customerPhone,
      total,
      items: {
        create: items.map((item) => {
          const p = products.find((x) => x.id === item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(p.discountPrice ?? p.price),
          };
        }),
      },
    },
  });

  return NextResponse.json({
    orderId: order.id,
    total,
    pixKey: settings?.pixKey ?? "",
    storeName: settings?.name ?? "ED Barbearia",
    merchantCity: settings?.address?.split(",")[1]?.trim().split("—")[0]?.trim() ?? "Recife",
  });
}
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/pix.ts src/lib/validations/checkout.ts src/app/api/public/checkout/route.ts src/__tests__/lib/pix.test.ts
git commit -m "feat(checkout): add PIX BR Code generator and checkout API"
```

---

## Task 13: Checkout page

**Files:**
- Create: `src/app/checkout/page.tsx`

- [ ] **Step 1: Install qrcode.react**

```bash
npm install qrcode.react
```

- [ ] **Step 2: Create checkout page**

Create `src/app/checkout/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { generatePixCode } from "@/lib/pix";

type OrderResult = {
  orderId: number;
  total: number;
  pixKey: string;
  storeName: string;
  merchantCity: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pedido");
        return;
      }

      clearCart();
      setOrder(data);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!order) return;
    const code = generatePixCode({
      pixKey: order.pixKey,
      merchantName: order.storeName,
      merchantCity: order.merchantCity,
      amount: order.total,
      txId: String(order.orderId),
    });
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-text-primary text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  // Step 2: PIX screen
  if (order) {
    const pixCode = generatePixCode({
      pixKey: order.pixKey,
      merchantName: order.storeName,
      merchantCity: order.merchantCity,
      amount: order.total,
      txId: String(order.orderId),
    });

    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background-primary">
          <div className="max-w-lg mx-auto px-6 py-24 text-center">
            <div className="text-gold text-4xl mb-4">✓</div>
            <h1 className="font-heading text-text-primary text-3xl mb-2">Pedido #{order.orderId}</h1>
            <p className="text-text-secondary mb-8">
              Escaneie o QR code abaixo para pagar R$ {fmt(order.total)} via PIX.
            </p>

            {order.pixKey ? (
              <>
                <div className="inline-block bg-white p-4 mb-6">
                  <QRCodeSVG value={pixCode} size={200} />
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Após o pagamento, seu pedido será confirmado em até 1 hora.
                </p>
                <Button variant="outline" size="md" onClick={copyCode} className="mb-4 w-full">
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </Button>
              </>
            ) : (
              <p className="text-text-secondary mb-6">
                Chave PIX não configurada. Entre em contato com a loja para finalizar o pagamento.
              </p>
            )}

            <Link href="/produtos">
              <Button variant="ghost" size="md">Voltar à loja</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Empty cart
  if (totalItems === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background-primary flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-text-secondary text-lg mb-6">Seu carrinho está vazio.</p>
            <Link href="/produtos">
              <Button variant="primary" size="lg">Ver produtos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Step 1: Cart summary + form
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background-primary">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="font-heading text-text-primary text-3xl mb-10">Finalizar Compra</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Cart summary */}
            <div>
              <h2 className="text-text-primary font-semibold text-lg mb-4">Resumo do pedido</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border bg-background-tertiary">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-text-secondary text-xs">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-text-primary text-sm font-semibold shrink-0">
                      R$ {fmt(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex justify-between">
                <span className="text-text-primary font-semibold">Total</span>
                <span className="text-gold font-bold text-xl">R$ {fmt(totalPrice)}</span>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="text-text-primary font-semibold text-lg mb-4">Seus dados</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Nome completo *</label>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Telefone / WhatsApp *</label>
                  <input
                    className={inputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    minLength={8}
                    maxLength={20}
                    placeholder="(81) 99999-9999"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Processando..." : "Gerar QR Code PIX"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Test full checkout flow**

1. Add products to cart from product detail pages
2. Click cart icon in navbar → arrives at `/checkout`
3. Fill name + phone → click "Gerar QR Code PIX"
4. QR code renders with the order total
5. "Copiar código PIX" copies to clipboard
6. "Voltar à loja" redirects to `/produtos`
7. Cart badge in navbar shows 0 after order is placed

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/ package.json package-lock.json
git commit -m "feat(checkout): implement static PIX checkout with QR code"
```

---

## Task 14: Admin orders page + sidebar

**Files:**
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/orders/[id]/route.ts`
- Create: `src/app/admin/(protected)/orders/page.tsx`
- Modify: `src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx`

- [ ] **Step 1: Create orders API**

Create `src/app/api/admin/orders/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(orders);
}
```

Create `src/app/api/admin/orders/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "bookings", "update");
  if (auth instanceof NextResponse) return auth;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: validation.data.status },
    });
    return NextResponse.json(order);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
```

- [ ] **Step 2: Create orders admin page**

Create `src/app/admin/(protected)/orders/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type OrderItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  items: OrderItem[];
};

const STATUS_LABELS: Record<Order["status"], string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: Order["status"]) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  }

  const fmt = (n: number) =>
    Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="mt-1 text-sm text-gray-600">{orders.length} pedidos no total</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Cliente", "Itens", "Total", "Status", "Data", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-sm text-gray-500">#{o.id}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.customerPhone}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">R$ {fmt(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {o.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(o.id, "PAID")}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateStatus(o.id, "CANCELLED")}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum pedido ainda</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add "Pedidos" to admin sidebar**

In `src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx`, add to the `navItems` array, after the `Produtos` entry:

```ts
  {
    href: "/admin/orders",
    label: "Pedidos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
```

- [ ] **Step 4: Test admin orders**

1. Place a test order via checkout
2. Navigate to `http://localhost:3000/admin/orders`
3. Confirm order appears with status "Pendente"
4. Click "Confirmar" → status changes to "Pago" (green badge)

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/orders/ "src/app/admin/(protected)/orders/" "src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx"
git commit -m "feat(admin): add orders management page and status updates"
```

---

## Self-review

**Spec coverage check:**
- ✅ Schema: Product (slug, discountPrice, images relation), ProductImage, Order, OrderItem, OrderStatus, pixKey on Settings
- ✅ Upload API: POST with sharp + DELETE with path traversal protection
- ✅ Seeds: 12 products, 3 categories, 5 with discountPrice, 3 images each
- ✅ Admin CRUD: list with thumbnail+badge, GET/PUT/DELETE [id] route, new/edit pages with form
- ✅ Admin form: slug auto-gen, image upload, drag-and-drop reorder, primary marker
- ✅ Public API: GET /products (limit, categoryId), GET /products/[slug]
- ✅ /produtos: category filter pills, grid, ProductCard
- ✅ ProductsCarousel: home carousel, prev/next, mobile scroll
- ✅ /produtos/[slug]: gallery with thumbnail strip, price/discount display, quantity selector, related products, generateMetadata, notFound()
- ✅ Cart: CartContext, localStorage persistence, useCart hook, totalItems, addItem/removeItem/updateQuantity/clearCart
- ✅ Navbar: "Produtos" link + cart icon with badge
- ✅ PIX: generatePixCode with EMVCo format + CRC16 (tested)
- ✅ Checkout API: stock validation, Order+OrderItem creation, returns pixKey
- ✅ Checkout page: cart summary, customer form, QR code, copy button, empty cart redirect
- ✅ Admin orders: list, status update (PAID/CANCELLED), sidebar entry
