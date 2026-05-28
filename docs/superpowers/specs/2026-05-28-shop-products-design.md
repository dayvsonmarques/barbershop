# Design: Funcionalidade de Loja (Shop / Products)

**Data:** 2026-05-28
**Branch:** `feature/shop-products`
**Status:** Aprovado

---

## Contexto

A ED Barbearia já possui um modelo `Product` básico no banco (sem slug, sem imagens múltiplas, sem desconto) e uma página de admin rudimentar. Esta spec cobre a implementação completa da loja pública, carrinho e checkout PIX estático.

---

## Decisões de design

| Questão | Decisão |
|---------|---------|
| Variantes/tamanhos | Não — produtos simples sem variantes |
| Navbar | Link simples `/produtos` (igual aos outros itens) |
| Imagens no admin | Upload de arquivo real (salvo em `/public/uploads/products/`) |
| Estrutura do admin | Páginas separadas: lista + `/new` + `/[id]/edit` |
| Carrinho | React Context + localStorage |
| Checkout | PIX estático com BR Code (EMVCo + CRC16) |

---

## 1. Schema

### Mudanças no modelo `Product`

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

Campos removidos: `imageUrl` (substituído pela relação `ProductImage`).

### Novo modelo `ProductImage`

```prisma
model ProductImage {
  id         Int      @id @default(autoincrement())
  productId  Int
  url        String
  position   Int      @default(0)
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}
```

### Novos modelos de pedido

```prisma
model Order {
  id              Int         @id @default(autoincrement())
  customerName    String
  customerPhone   String
  total           Decimal     @db.Decimal(10, 2)
  status          OrderStatus @default(PENDING)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items           OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  PAID
  CANCELLED
}

model OrderItem {
  id         Int     @id @default(autoincrement())
  orderId    Int
  productId  Int
  quantity   Int
  unitPrice  Decimal @db.Decimal(10, 2)

  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@map("order_items")
}
```

### Mudança em `EstablishmentSettings`

```prisma
pixKey  String?   // Chave PIX do estabelecimento (CPF, CNPJ, email, telefone ou aleatória)
```

---

## 2. Upload de imagens

**Rota:** `POST /api/admin/upload/product-image`

- Aceita `multipart/form-data` com campo `file`
- Validação: somente `image/jpeg`, `image/png`, `image/webp` — máx **5 MB**
- Processa com `sharp`: converte para WebP, redimensiona para máx 1200×1200 mantendo proporção
- Salva em `/public/uploads/products/{uuid}.webp`
- Retorna `{ url: "/uploads/products/{uuid}.webp" }`

**Rota:** `DELETE /api/admin/upload/product-image?file={path}`

- Remove arquivo físico em `/public{path}`
- Só permite caminhos dentro de `/uploads/products/` (prevenção de path traversal)

---

## 3. Admin — CRUD de Produtos

### Rotas de API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/products` | Lista com paginação + filtros |
| POST | `/api/admin/products` | Cria produto (já existe, será estendido) |
| GET | `/api/admin/products/[id]` | Busca produto por ID |
| PUT | `/api/admin/products/[id]` | Atualiza produto |
| DELETE | `/api/admin/products/[id]` | Remove produto (soft delete via `isActive`) |

Todas as rotas exigem permissão `products:view/create/update/delete` via `requirePermission`.

### Validação (Zod)

Schema `productSchema` atualizado com: `slug`, `discountPrice?`, `images` (array de `{ url, position, isPrimary }`).

### Páginas admin

**`/admin/products`** — Lista
- Tabela: thumbnail (imagem primária), nome, categoria, preço, desconto (badge dourado se presente), estoque, status, ações (editar / excluir)
- Botão "+ Novo Produto" → navega para `/admin/products/new`

**`/admin/products/new`** e **`/admin/products/[id]/edit`** — Formulário
- Campos: nome, slug (auto-gerado do nome, editável manualmente), categoria (select), descrição (textarea), preço, preço com desconto (opcional), estoque, toggle ativo/inativo
- Seção de imagens: upload múltiplo (input file), preview dos uploads, drag-and-drop para reordenar, marcação da imagem primária (estrela), botão de remoção por imagem
- Ao gerar slug: substitui espaços por `-`, remove acentos, lowercase
- Submit cria/atualiza produto + imagens numa transação

---

## 4. API Pública

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/public/products` | Lista produtos ativos (com imagem primária e categoria) |
| GET | `/api/public/products/[slug]` | Produto por slug (com todas as imagens) |

`/api/public/products` aceita query params:
- `?categoryId=` — filtra por categoria
- `?limit=8&featured=true` — para uso no carrossel da home

Sem autenticação. Retorna apenas produtos com `isActive: true`.

---

## 5. Páginas públicas

### `/produtos` — Listagem

- Layout: filtro de categoria (pills horizontais no topo) + grid 1/2/3 colunas responsivo
- `ProductCard`: imagem primária, nome, preço (com badge de desconto se houver), botão "Ver produto"
- Server Component (dados via Prisma direto, não via fetch)
- Sem paginação na v1 (scroll infinito ou "carregar mais" ficam para v2)

### `/produtos/[slug]` — Detalhe

- Server Component para dados SEO + Client Component para interação
- **Galeria:** imagem principal grande + strip de miniaturas abaixo; click na miniatura troca imagem principal com transição suave
- **Coluna direita:**
  - Nome (`h1`), categoria
  - Preço: se tiver desconto → preço original riscado + preço com desconto em destaque + badge "X% OFF"
  - Descrição curta
  - Seletor de quantidade: botões `−` / `+` (mín 1, máx estoque)
  - Botão primário "Adicionar ao Carrinho"
  - Botão secundário "Comprar Agora" (adiciona ao carrinho e redireciona para `/checkout`)
- **Abaixo do fold:** descrição completa + seção "Produtos Relacionados" (4 produtos da mesma categoria, grid)
- **SEO:** `generateMetadata` com `title`, `description`, `openGraph` usando dados do produto
- **404:** se produto não encontrado ou `isActive: false` → `notFound()`

### Home — `ProductsCarousel`

- Componente inserido entre `InstagramFeed` e `MapSection` em `page.tsx`
- Busca 8 produtos ativos com `orderBy: { createdAt: "desc" }` (mais recentes)
- Desktop: 4 cards visíveis, scroll com botões prev/next
- Mobile: 1.5 cards visíveis (peek do próximo), scroll por swipe
- Wrapped em `<ScrollReveal>`

---

## 6. Carrinho

**`CartContext`** (`src/contexts/cart-context.tsx`)

Estado persistido em `localStorage` sob a chave `"ed-cart"`.

```ts
type CartItem = {
  productId: number
  name: string
  price: number          // preço efetivo (discountPrice ?? price)
  imageUrl: string
  quantity: number
}
```

Hook `useCart()` expõe: `items`, `totalItems`, `totalPrice`, `addItem(product)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clearCart()`.

**Ícone na navbar:** badge circular com `totalItems` sobreposto ao ícone de sacola, exibido apenas quando `totalItems > 0`. Link para `/checkout`.

---

## 7. Checkout

**Rota:** `/checkout`

### Fluxo

1. **Resumo do carrinho** — lista de itens com quantidade e preço, total
2. **Formulário** — nome (obrigatório) + telefone (obrigatório)
3. **Submissão:**
   - Cria registro `Order` + `OrderItem[]` via `POST /api/public/checkout`
   - Resposta inclui `orderId` e `pixKey` do estabelecimento
4. **Tela de pagamento PIX:**
   - QR Code gerado client-side via `qrcode.react` usando o BR Code PIX
   - Valor total exibido
   - Botão "Copiar código PIX" (copia o BR Code para área de transferência)
   - Instruções: "Após o pagamento, seu pedido será confirmado em até 1 hora"
   - Botão "Voltar à loja"
   - Limpa o carrinho após exibir o QR code

### Geração do BR Code PIX

Utilitário `src/lib/pix.ts`:
- Implementa o formato EMVCo (padrão BR Code do Banco Central)
- Campos: chave PIX, nome do recebedor (da `EstablishmentSettings`), valor, cidade, ID de transação
- CRC16/CCITT para checksum final
- Sem dependência externa (implementação pura em TypeScript)

### API de checkout

`POST /api/public/checkout`
- Body: `{ customerName, customerPhone, items: [{ productId, quantity }] }`
- Valida estoque de cada item
- Busca `pixKey` de `EstablishmentSettings`
- Cria `Order` + `OrderItems` em transação
- Retorna `{ orderId, pixKey, total, storeName }`
- Não decrementua estoque automaticamente (admin confirma pagamento manualmente)

### Admin — Pedidos

`/admin/orders` — lista de pedidos com: data, nome do cliente, telefone, total, status (badge colorido), botão para marcar como PAID ou CANCELLED.

API: `GET /api/admin/orders`, `PUT /api/admin/orders/[id]` (só atualiza status).

Sidebar: adicionar item "Pedidos" com ícone de sacola.

---

## 8. Seeds — 12 produtos

12 produtos distribuídos em 3 categorias: as 2 existentes (Pomadas, Óleos para Barba) + 1 nova criada no seed (Shampoos e Condicionadores). Cada produto com:
- 3 imagens via `https://picsum.photos/seed/{seed}/800/800`
- Pelo menos 5 com `discountPrice`
- Preços realistas em BRL
- Slugs gerados do nome

Seguir exatamente o padrão do `prisma/seed.ts` existente.

---

## 9. Arquivos a criar/modificar

### Novos
```
prisma/migrations/YYYYMMDD_add_shop_features/
src/contexts/cart-context.tsx
src/lib/pix.ts
src/lib/slug.ts
src/components/products-carousel.tsx
src/components/product-card.tsx
src/app/produtos/page.tsx
src/app/produtos/[slug]/page.tsx
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
src/app/admin/(protected)/orders/page.tsx
docs/superpowers/specs/2026-05-28-shop-products-design.md
```

### Modificados
```
prisma/schema.prisma
prisma/seed.ts
src/app/page.tsx
src/app/layout.tsx                     (adicionar CartProvider no root layout — admin ignora o contexto)
src/components/navbar.tsx              (link Produtos + ícone carrinho)
src/app/admin/(protected)/_components/Layouts/sidebar/index.tsx  (item Pedidos)
src/app/admin/(protected)/products/page.tsx  (refatorar com CRUD completo)
src/lib/validations/products-courses.ts      (schema atualizado)
```

---

## 10. Dependências a instalar

| Pacote | Uso |
|--------|-----|
| `sharp` | Conversão e redimensionamento de imagens no upload |
| `qrcode.react` | Renderização do QR Code PIX no checkout |
| `@hello-pangea/dnd` | Drag-and-drop para reordenar imagens no admin |

---

## Commits planejados

```
feat(db): add product images, orders schema and PIX key field
feat(admin): add product image upload API
feat(db): seed 12 products with images and discount prices
feat(admin): implement full product CRUD with edit pages
feat(shop): add product carousel to home and listing page
feat(shop): implement product detail page with image gallery
feat(cart): add localStorage cart context and navbar badge
feat(checkout): implement static PIX checkout with QR code
feat(admin): add orders management page and status updates
```
