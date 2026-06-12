# Design: Gerenciamento de Depoimentos no Admin

**Data:** 2026-06-05
**Status:** Aprovado

## Visão Geral

Tornar os depoimentos exibidos na landing page gerenciáveis pelo admin. Atualmente são hardcoded em `src/components/testimonials-section.tsx`. A implementação adiciona um modelo no banco, uma API REST, uma página admin com CRUD completo + reordenação por drag-and-drop, e um botão "Avaliar no Google" abaixo do carrossel.

## Banco de Dados

Novo modelo `Testimonial` no Prisma:

```prisma
model Testimonial {
  id        Int      @id @default(autoincrement())
  author    String
  quote     String   @db.Text
  avatarUrl String?
  rating    Int      @default(5)   // 1-5
  position  Int      @default(0)   // ordem de exibição
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("testimonials")
}
```

Os 6 depoimentos hardcoded atuais serão inseridos via Prisma seed script (`prisma/seed.ts` ou equivalente), mantendo os caminhos de avatar existentes (`/images/testimonials/avatar-0x.png`).

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/testimonials` | Lista todos (ordenado por `position`) |
| POST | `/api/admin/testimonials` | Cria novo depoimento |
| PUT | `/api/admin/testimonials/[id]` | Atualiza depoimento |
| DELETE | `/api/admin/testimonials/[id]` | Remove depoimento |
| POST | `/api/admin/testimonials/reorder` | Atualiza `position` em lote (array de `{id, position}`) |

Upload de avatar reutiliza o endpoint existente `/api/admin/upload/product-image` (retorna URL pública).

Todas as rotas são protegidas pela mesma middleware de autenticação admin já existente.

## Admin — Página `/admin/testimonials`

Segue o padrão das páginas existentes (client component, fetch direto das APIs).

**Lista:** Tabela com colunas: Avatar (miniatura), Autor, Trecho do depoimento, Rating (estrelas), Status (ativo/inativo), Ações (Editar / Excluir). Drag-and-drop nas linhas usando `@hello-pangea/dnd` (já instalado no projeto) para reordenar — ao soltar, dispara `POST /reorder` com as novas posições.

**Formulário (modal):** Abre ao clicar em "+ Novo" ou "Editar". Campos:
- Autor (texto obrigatório)
- Depoimento (textarea obrigatório)
- Rating (seletor 1-5 estrelas)
- Avatar (upload de imagem, opcional — preview ao selecionar)
- Ativo (toggle)

**Sidebar:** Adicionar item "Depoimentos" no array `navItems` em `sidebar/index.tsx`, com ícone de aspas.

## Site — Componente de Depoimentos

`TestimonialsSection` passa de client component com dados hardcoded para **Server Component** que busca os depoimentos do banco via Prisma diretamente (sem API route, pois é server-side). Filtra `isActive: true`, ordena por `position ASC`.

A lógica do carrossel (useState, useEffect, drag) permanece em um `TestimonialsCarousel` client component filho que recebe os dados como prop.

## Botão Google Reviews

Abaixo do carrossel e dos dots de navegação, adicionar um link com aparência de botão secundário:

```
[ ★ Deixar uma avaliação no Google ]
```

URL: `https://share.google/xdHNXs84SjNMb2jJt` — abre em nova aba (`target="_blank"`). Estilo alinhado com o design existente (borda dourada, texto `text-text-secondary`, hover com `text-gold`).

## Fluxo de Dados

```
Admin salva depoimento
  → POST/PUT /api/admin/testimonials
    → Prisma upsert na tabela testimonials

Usuário acessa landing page
  → TestimonialsSection (Server Component)
    → prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } })
      → passa dados para TestimonialsCarousel (Client Component)
```

## Fora do Escopo

- Depoimentos submetidos por clientes via formulário público.
- Moderação ou aprovação de depoimentos.
- Paginação (volume esperado é pequeno, < 20 itens).
