# Testimonials Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar os depoimentos da landing page gerenciáveis via admin com CRUD completo, drag-and-drop para reordenação, upload de avatar, e adicionar botão "Avaliar no Google" abaixo do carrossel.

**Architecture:** Novo modelo Prisma `Testimonial` persistido no PostgreSQL. API REST protegida por RBAC em `/api/admin/testimonials`. `TestimonialsSection` refatorada para Server Component que busca do banco e passa dados para `TestimonialsCarousel` (Client Component com toda a lógica do carrossel).

**Tech Stack:** Next.js 15 (App Router), Prisma ORM, Zod, `@hello-pangea/dnd` (já instalado), sharp para processamento de imagem, Vitest para testes.

---

## File Map

**Criar:**
- `src/lib/validations/testimonials.ts` — schemas Zod para create/update e reorder
- `src/__tests__/lib/validations/testimonials.test.ts` — testes da validação
- `src/app/api/admin/testimonials/route.ts` — GET lista, POST cria
- `src/app/api/admin/testimonials/[id]/route.ts` — PUT atualiza, DELETE remove
- `src/app/api/admin/testimonials/reorder/route.ts` — POST reordena (atualiza positions em lote)
- `src/app/api/admin/upload/testimonial-avatar/route.ts` — POST upload de avatar
- `src/app/admin/(protected)/testimonials/page.tsx` — página admin com tabela + drag-and-drop + modal
- `src/components/testimonials-carousel.tsx` — Client Component com a lógica do carrossel

**Modificar:**
- `prisma/schema.prisma` — adicionar model `Testimonial`
- `prisma/seed.ts` — adicionar `"testimonials"` aos resources de permissão + seed dos 6 depoimentos
- `src/components/testimonials-section.tsx` — converter para Server Component, remover hardcode, importar carousel, adicionar botão Google
- `src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx` — adicionar item "Depoimentos" no nav

---

## Task 1: Prisma — Adicionar model Testimonial

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar o model ao schema**

Adicionar ao final de `prisma/schema.prisma`, antes do fechamento do arquivo (após o model `PhoneOtp`):

```prisma
// ============================================
// TESTIMONIALS
// ============================================

model Testimonial {
  id        Int      @id @default(autoincrement())
  author    String
  quote     String   @db.Text
  avatarUrl String?
  rating    Int      @default(5)
  position  Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("testimonials")
}
```

- [ ] **Step 2: Gerar e aplicar a migration**

```bash
npx prisma migrate dev --name add-testimonials
```

Saída esperada: `The following migration(s) have been applied: .../add_testimonials/migration.sql`

- [ ] **Step 3: Gerar o cliente Prisma**

```bash
npx prisma generate
```

- [ ] **Step 4: Criar diretório de upload para avatars**

```bash
mkdir -p public/uploads/testimonials && touch public/uploads/testimonials/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ public/uploads/testimonials/.gitkeep
git commit -m "feat(testimonials): adicionar model Testimonial ao schema"
```

---

## Task 2: Validação Zod + testes

**Files:**
- Create: `src/lib/validations/testimonials.ts`
- Create: `src/__tests__/lib/validations/testimonials.test.ts`

- [ ] **Step 1: Escrever os testes antes da implementação**

Criar `src/__tests__/lib/validations/testimonials.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { testimonialSchema, reorderSchema } from "@/lib/validations/testimonials";

const valid = {
  author: "João Silva",
  quote: "Excelente barbearia!",
  rating: 5,
  isActive: true,
};

describe("testimonialSchema", () => {
  it("accepts valid testimonial", () => {
    expect(testimonialSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty author", () => {
    expect(testimonialSchema.safeParse({ ...valid, author: "" }).success).toBe(false);
  });

  it("rejects empty quote", () => {
    expect(testimonialSchema.safeParse({ ...valid, quote: "" }).success).toBe(false);
  });

  it("rejects rating below 1", () => {
    expect(testimonialSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it("rejects rating above 5", () => {
    expect(testimonialSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("accepts null avatarUrl", () => {
    expect(testimonialSchema.safeParse({ ...valid, avatarUrl: null }).success).toBe(true);
  });

  it("accepts string avatarUrl (local path)", () => {
    expect(testimonialSchema.safeParse({ ...valid, avatarUrl: "/uploads/testimonials/abc.webp" }).success).toBe(true);
  });

  it("defaults rating to 5 when omitted", () => {
    const result = testimonialSchema.safeParse({ author: "A", quote: "B" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rating).toBe(5);
  });

  it("defaults isActive to true when omitted", () => {
    const result = testimonialSchema.safeParse({ author: "A", quote: "B" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });
});

describe("reorderSchema", () => {
  it("accepts valid reorder array", () => {
    const data = [{ id: 1, position: 0 }, { id: 2, position: 1 }];
    expect(reorderSchema.safeParse(data).success).toBe(true);
  });

  it("rejects non-integer position", () => {
    const data = [{ id: 1, position: 1.5 }];
    expect(reorderSchema.safeParse(data).success).toBe(false);
  });

  it("rejects negative id", () => {
    const data = [{ id: -1, position: 0 }];
    expect(reorderSchema.safeParse(data).success).toBe(false);
  });

  it("rejects empty array", () => {
    expect(reorderSchema.safeParse([]).success).toBe(false);
  });
});
```

- [ ] **Step 2: Executar os testes — confirmar que falham**

```bash
npx vitest run src/__tests__/lib/validations/testimonials.test.ts
```

Saída esperada: FAIL com `Cannot find module '@/lib/validations/testimonials'`

- [ ] **Step 3: Implementar os schemas**

Criar `src/lib/validations/testimonials.ts`:

```ts
import { z } from "zod";

export const testimonialSchema = z.object({
  author: z.string().min(1, "Autor é obrigatório").max(100),
  quote: z.string().min(1, "Depoimento é obrigatório").max(2000),
  avatarUrl: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const reorderSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    position: z.number().int().min(0),
  })
).min(1);

export type TestimonialInput = z.infer<typeof testimonialSchema>;
```

- [ ] **Step 4: Executar os testes — confirmar que passam**

```bash
npx vitest run src/__tests__/lib/validations/testimonials.test.ts
```

Saída esperada: `✓ src/__tests__/lib/validations/testimonials.test.ts (11)` — todos passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/testimonials.ts src/__tests__/lib/validations/testimonials.test.ts
git commit -m "feat(testimonials): adicionar schema de validação Zod com testes"
```

---

## Task 3: API — GET lista e POST criar

**Files:**
- Create: `src/app/api/admin/testimonials/route.ts`

- [ ] **Step 1: Criar a rota**

Criar `src/app/api/admin/testimonials/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { testimonialSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "view");
  if (auth instanceof NextResponse) return auth;

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { position: "asc" },
  });

  return NextResponse.json(testimonials);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "create");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = testimonialSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const count = await prisma.testimonial.count();
  const testimonial = await prisma.testimonial.create({
    data: { ...validation.data, position: validation.data.position ?? count },
  });

  return NextResponse.json(testimonial, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/testimonials/route.ts
git commit -m "feat(testimonials): adicionar rota GET e POST /api/admin/testimonials"
```

---

## Task 4: API — PUT atualizar e DELETE remover

**Files:**
- Create: `src/app/api/admin/testimonials/[id]/route.ts`

- [ ] **Step 1: Criar a rota**

Criar `src/app/api/admin/testimonials/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { testimonialSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  if (!/^\d+$/.test(id)) return null;
  return parseInt(id, 10);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "testimonials", "update");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = testimonialSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: validation.data,
    });
    return NextResponse.json(testimonial);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "testimonials", "delete");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/testimonials/[id]/route.ts
git commit -m "feat(testimonials): adicionar rota PUT e DELETE /api/admin/testimonials/[id]"
```

---

## Task 5: API — POST reorder

**Files:**
- Create: `src/app/api/admin/testimonials/reorder/route.ts`

- [ ] **Step 1: Criar a rota**

Criar `src/app/api/admin/testimonials/reorder/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { reorderSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "update");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = reorderSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    validation.data.map(({ id, position }) =>
      prisma.testimonial.update({ where: { id }, data: { position } })
    )
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/testimonials/reorder/route.ts
git commit -m "feat(testimonials): adicionar rota POST /api/admin/testimonials/reorder"
```

---

## Task 6: Upload de avatar para depoimentos

**Files:**
- Create: `src/app/api/admin/upload/testimonial-avatar/route.ts`

- [ ] **Step 1: Criar a rota de upload**

Criar `src/app/api/admin/upload/testimonial-avatar/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "testimonials");

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "create");
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Invalid type. Allowed: JPEG, PNG, WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.webp`;
    const filepath = join(UPLOAD_DIR, filename);

    await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 85 })
      .toFile(filepath);

    return NextResponse.json({ url: `/uploads/testimonials/${filename}` });
  } catch (error) {
    console.error("Error processing avatar upload:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "delete");
  if (auth instanceof NextResponse) return auth;

  const filePath = new URL(request.url).searchParams.get("file") ?? "";

  if (!filePath.startsWith("/uploads/testimonials/") || filePath.includes("..")) {
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

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/upload/testimonial-avatar/route.ts
git commit -m "feat(testimonials): adicionar rota de upload de avatar"
```

---

## Task 7: Admin — Adicionar item no sidebar

**Files:**
- Modify: `src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx`

- [ ] **Step 1: Adicionar item "Depoimentos" ao array navItems**

No arquivo `src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx`, adicionar o item após o item de "Cursos" (linha ~68):

```ts
  { href: "/admin/testimonials", label: "Depoimentos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
      </svg>
    ),
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx
git commit -m "feat(testimonials): adicionar item Depoimentos no sidebar"
```

---

## Task 8: Admin — Página de gerenciamento de depoimentos

**Files:**
- Create: `src/app/admin/(protected)/testimonials/page.tsx`

- [ ] **Step 1: Criar a página admin**

Criar `src/app/admin/(protected)/testimonials/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Testimonial = {
  id: number;
  author: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
  position: number;
  isActive: boolean;
};

type FormState = {
  author: string;
  quote: string;
  avatarUrl: string;
  rating: number;
  isActive: boolean;
};

const emptyForm: FormState = { author: "", quote: "", avatarUrl: "", rating: 5, isActive: true };

function Stars({ rating, onChange }: { rating: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={n <= rating ? "#C9A84C" : "none"} stroke="#C9A84C" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) setTestimonials(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setAvatarPreview("");
    setShowModal(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({ author: t.author, quote: t.quote, avatarUrl: t.avatarUrl ?? "", rating: t.rating, isActive: t.isActive });
    setAvatarPreview(t.avatarUrl ?? "");
    setShowModal(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload/testimonial-avatar", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setForm((f) => ({ ...f, avatarUrl: url }));
      setAvatarPreview(url);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/testimonials/${editing.id}` : "/api/admin/testimonials";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatarUrl: form.avatarUrl || null }),
      });
      if (res.ok) {
        await load();
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, author: string) {
    if (!confirm(`Excluir depoimento de "${author}"?`)) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) setTestimonials((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const items = Array.from(testimonials);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setTestimonials(items);
    await fetch("/api/admin/testimonials/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items.map((t, i) => ({ id: t.id, position: i }))),
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depoimentos</h1>
          <p className="mt-1 text-sm text-gray-600">{testimonials.length} depoimentos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Depoimento
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["", "Avatar", "Autor", "Depoimento", "Rating", "Status", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <Droppable droppableId="testimonials">
              {(provided) => (
                <tbody
                  className="divide-y divide-gray-200 bg-white"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {testimonials.map((t, index) => (
                    <Draggable key={t.id} draggableId={String(t.id)} index={index}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "bg-[#FDF8EE] shadow-md" : ""}
                        >
                          <td className="px-3 py-3 w-8" {...provided.dragHandleProps}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
                              <circle cx="9" cy="5" r="1" fill="#A1A1AA" /><circle cx="15" cy="5" r="1" fill="#A1A1AA" />
                              <circle cx="9" cy="12" r="1" fill="#A1A1AA" /><circle cx="15" cy="12" r="1" fill="#A1A1AA" />
                              <circle cx="9" cy="19" r="1" fill="#A1A1AA" /><circle cx="15" cy="19" r="1" fill="#A1A1AA" />
                            </svg>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                              {t.avatarUrl ? (
                                <Image src={t.avatarUrl} alt={t.author} fill sizes="40px" className="object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-400 text-xs font-semibold">
                                  {t.author.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{t.author}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                            <span className="line-clamp-2">{t.quote}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Stars rating={t.rating} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {t.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                            <button onClick={() => openEdit(t)} className="text-[#C9A84C] hover:text-[#A07830] mr-4">
                              Editar
                            </button>
                            <button onClick={() => handleDelete(t.id, t.author)} className="text-red-600 hover:text-red-900">
                              Excluir
                            </button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
        {testimonials.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum depoimento cadastrado</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Depoimento" : "Novo Depoimento"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="Preview" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-xl font-semibold">
                        {form.author.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Escolher imagem
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Autor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  placeholder="Nome do cliente"
                />
              </div>

              {/* Depoimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depoimento *</label>
                <textarea
                  required
                  rows={4}
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
                  placeholder="O que o cliente disse..."
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação</label>
                <Stars rating={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Exibir no site</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/(protected)/testimonials/page.tsx
git commit -m "feat(testimonials): adicionar página admin com CRUD e drag-and-drop"
```

---

## Task 9: Refatorar TestimonialsSection + botão Google

**Files:**
- Create: `src/components/testimonials-carousel.tsx`
- Modify: `src/components/testimonials-section.tsx`

- [ ] **Step 1: Criar TestimonialsCarousel (Client Component)**

Criar `src/components/testimonials-carousel.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type TestimonialData = {
  id: number;
  author: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
};

const INTERVAL = 5000;
const DRAG_THRESHOLD = 50;
const FADE_MS = 280;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? "#C9A84C" : "none"} stroke="#C9A84C" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author, avatarUrl, rating }: TestimonialData) {
  return (
    <div className="bg-background-secondary p-6 md:p-8 relative flex flex-col justify-between min-h-55 select-none">
      <span className="absolute top-4 left-6 text-gold opacity-20 font-heading text-7xl leading-none select-none" aria-hidden="true">
        &#8220;
      </span>
      <blockquote className="font-heading italic text-base md:text-lg text-text-primary pt-8 leading-snug">
        {quote}
      </blockquote>
      <footer className="mt-6 flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gold/30 bg-background-primary">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={author} fill sizes="44px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-text-secondary text-sm font-semibold">
              {author.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <Stars rating={rating} />
          <p className="text-text-secondary text-sm font-medium">{author}</p>
        </div>
      </footer>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function useVisibleCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 768) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

export function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialData[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);
  const visibleCount = useVisibleCount();

  const goTo = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setFading(true);
    fadeTimerRef.current = setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, FADE_MS);
  };

  const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((current + 1) % testimonials.length);

  useEffect(() => {
    timerRef.current = setTimeout(next, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const onDragStart = (clientX: number) => { dragStartX.current = clientX; };
  const onDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - clientX;
    if (Math.abs(diff) > DRAG_THRESHOLD) diff > 0 ? next() : prev();
    dragStartX.current = null;
  };

  const visibleCards = Array.from(
    { length: visibleCount },
    (_, i) => testimonials[(current + i) % testimonials.length]
  );

  const gridCols =
    visibleCount === 3 ? "grid-cols-3" :
    visibleCount === 2 ? "grid-cols-2" :
    "grid-cols-1";

  if (testimonials.length === 0) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
        >
          <ChevronLeft />
        </button>

        <div
          className={`grid gap-4 md:gap-6 ${gridCols} cursor-grab active:cursor-grabbing transition-opacity ease-in-out ${fading ? "opacity-0" : "opacity-100"}`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseUp={(e) => onDragEnd(e.clientX)}
          onMouseLeave={() => { dragStartX.current = null; }}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
        >
          {visibleCards.map((t, i) => (
            <TestimonialCard key={`${current}-${i}`} {...t} />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Próximo"
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Depoimento ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current ? "w-6 h-2 bg-gold" : "w-2 h-2 bg-text-secondary/30 hover:bg-text-secondary/60"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <a
          href="https://share.google/xdHNXs84SjNMb2jJt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-sm font-medium text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Deixar uma avaliação no Google
        </a>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Converter TestimonialsSection para Server Component**

Substituir todo o conteúdo de `src/components/testimonials-section.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/section-label";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";

export async function TestimonialsSection() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, author: true, quote: true, avatarUrl: true, rating: true },
  });

  return (
    <section id="depoimentos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/testimonials-section.tsx src/components/testimonials-carousel.tsx
git commit -m "feat(testimonials): refatorar para Server Component e adicionar botão Google Reviews"
```

---

## Task 10: Atualizar seed — permissões e dados iniciais

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Adicionar "testimonials" aos resources de permissão**

No arquivo `prisma/seed.ts`, na linha com `const resources = [...]`, adicionar `"testimonials"`:

```ts
const resources = ["users", "groups", "barbers", "services", "bookings", "products", "courses", "settings", "testimonials"];
```

- [ ] **Step 2: Adicionar "testimonials" ao TRUNCATE**

No TRUNCATE do seed, adicionar `"testimonials"` à lista de tabelas (antes do `CASCADE`). A linha atual é:

```ts
await prisma.$executeRaw`TRUNCATE TABLE "users", "groups", "permissions", "user_groups", "group_permissions", "password_resets", "service_categories", "services", "barbers", "barber_availability", "availability_exceptions", "bookings", "product_categories", "products", "courses", "establishment_settings" CASCADE`;
```

Substituir por:

```ts
await prisma.$executeRaw`TRUNCATE TABLE "users", "groups", "permissions", "user_groups", "group_permissions", "password_resets", "service_categories", "services", "barbers", "barber_availability", "availability_exceptions", "bookings", "product_categories", "products", "courses", "establishment_settings", "testimonials" CASCADE`;
```

- [ ] **Step 3: Adicionar bloco de seed de depoimentos**

Adicionar após o bloco de cursos (seção 9) e antes do bloco de establishment settings (seção 10), com o novo número de seção `10` e ajustando o settings para `11`:

```ts
  // ============================================
  // 10. TESTIMONIALS
  // ============================================
  console.log("💬 Creating testimonials...");

  await prisma.testimonial.createMany({
    data: [
      {
        author: "Ronald Vinicius",
        quote: "Muito agradável, um ótimo ambiente com ótimos profissionais.",
        avatarUrl: "/images/testimonials/avatar-01.png",
        rating: 5,
        position: 0,
      },
      {
        author: "Vinícius Lopes",
        quote: "Profissionais sensacionais, excelente ambiente climatizado, cortes agendados sem necessidade de espera. Recomendo e sou cliente há anos!",
        avatarUrl: "/images/testimonials/avatar-02.png",
        rating: 5,
        position: 1,
      },
      {
        author: "Marcos Egito",
        quote: "Atendimento muito bom, os rapazes são muito educados e prestativos. Fazem aquilo que você pede, nada mais nada menos — eles até sugerem caso você peça. Muito bom o resultado do corte de cabelo.",
        avatarUrl: "/images/testimonials/avatar-03.png",
        rating: 5,
        position: 2,
      },
      {
        author: "Adricia Rodrigues",
        quote: "Amei demais o meu corte de cabelo, foi realmente como eu esperava. Aconselho demais vocês fazerem nessa barbearia, todos são um amor de pessoa, top!",
        avatarUrl: "/images/testimonials/avatar-04.png",
        rating: 5,
        position: 3,
      },
      {
        author: "Mateus Willis",
        quote: "Ambiente profissional, bastante organizado com barbeiros impecáveis. Preço acessível e tem até cafezinho. Nota 1000.",
        avatarUrl: "/images/testimonials/avatar-05.png",
        rating: 5,
        position: 4,
      },
      {
        author: "Pato Marques",
        quote: "Ótima barbearia. Atendimento excelente, profissionais muito bons, ambiente aconchegante. Estou frequentando há mais de um ano, só tenho a agradecer.",
        avatarUrl: "/images/testimonials/avatar-06.png",
        rating: 5,
        position: 5,
      },
    ],
  });
```

- [ ] **Step 4: Executar o seed em desenvolvimento para validar**

```bash
npx ts-node --project tsconfig.json -e "require('./prisma/seed.ts')" 2>/dev/null || npx prisma db seed
```

Saída esperada: `✅ Seed completed successfully!`

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(testimonials): adicionar permissões e seed dos depoimentos iniciais"
```

---

## Task 11: Verificação final

- [ ] **Step 1: Executar todos os testes**

```bash
npx vitest run
```

Saída esperada: todos os testes passando, incluindo `testimonials.test.ts`.

- [ ] **Step 2: Build de produção**

```bash
npm run build
```

Saída esperada: sem erros de TypeScript ou de build.

- [ ] **Step 3: Verificar funcionalidades manualmente**

Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

Verificar:
- [ ] Landing page (`/`) exibe os depoimentos do banco (não mais hardcoded)
- [ ] Botão "Deixar uma avaliação no Google" aparece abaixo dos dots do carrossel
- [ ] Admin (`/admin/testimonials`) lista os depoimentos com drag handle
- [ ] Reordenação por drag-and-drop funciona e persiste
- [ ] Modal de criação salva novo depoimento e aparece na lista
- [ ] Modal de edição preenche os campos e salva as alterações
- [ ] Upload de avatar funciona e exibe preview
- [ ] Toggle de ativo/inativo reflete no site (depoimento inativo não aparece)
- [ ] Exclusão remove o depoimento com confirmação
- [ ] Item "Depoimentos" aparece no sidebar do admin
