FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Instala dependências e gera o cliente Prisma
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Monta a pasta final em um único diretório para evitar cópias sobrepostas
# em node_modules (causavam erro de extração de camadas no servidor)
RUN mkdir -p /out/.next /out/node_modules \
 && cp -a .next/standalone/. /out/ \
 && cp -a .next/static /out/.next/static \
 && cp -a public prisma prisma.config.ts /out/ \
 && cd /tmp && mkdir cli && cd cli && npm init -y >/dev/null \
 && v() { node -p "require('/app/node_modules/$1/package.json').version"; } \
 && npm install --omit=dev --no-audit --no-fund \
      prisma@$(v prisma) @prisma/adapter-pg@$(v @prisma/adapter-pg) \
      dotenv@$(v dotenv) tsx@$(v tsx) bcryptjs@$(v bcryptjs) pg@$(v pg) \
 && cp -a node_modules/. /out/node_modules/ \
 && cp -a /app/node_modules/.prisma /out/node_modules/

# Imagem final mínima (standalone)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /out ./

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
