# Barbearia SaaS

Plataforma web para barbearias: site público com agendamento online, loja e painel administrativo.

**Stack:** Next.js · TypeScript · Tailwind · PostgreSQL · Prisma

## Funcionalidades

- **Site público:** banner, serviços, equipe, loja com checkout PIX, depoimentos, Instagram e localização
- **Agendamento:** horários em tempo real, sem conflitos, lembrete por WhatsApp
- **Painel admin:** barbeiros, serviços, produtos, pedidos, agenda, relatórios e configurações da barbearia (nome, endereço, horário, redes sociais)
- **Acesso:** permissões por perfil (RBAC)
- **PWA:** instalável no celular

## Como rodar

Requisitos: Node.js 18+ e Docker.

```bash
npm install
cp .env.example .env   # ajuste conforme docs/ENV.md
npm run dev:full       # sobe Postgres + Mailpit, migra, popula e inicia
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts principais

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run dev:full` | Infra + banco + servidor |
| `npm run db:reset` | Zera e recria o banco |
| `npm run build` | Build de produção |
| `npm test` | Testes |

## Documentação

- [Variáveis de ambiente](docs/ENV.md)
- [Convenções](docs/CONVENTIONS.md)
