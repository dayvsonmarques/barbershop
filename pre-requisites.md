Você é um engenheiro de software sênior. Crie uma aplicação web completa para uma barbearia.

## Stack e requisitos
- Framework: Next.js (última versão estável) com App Router.
- UI: TailwindCSS.
- Banco: PostgreSQL.
- Design: responsivo (mobile-first), boa usabilidade e acessibilidade (WAI-ARIA quando necessário).
- Boas práticas: DI/IoC quando fizer sentido, DRY, SOLID, separação de responsabilidades, código limpo, componentes reutilizáveis.
- Padrões: tipagem forte (TypeScript), lint/format (ESLint + Prettier), validação (Zod), ORM (Prisma).
- Segurança: proteção contra CSRF/XSS, validação server-side, RBAC e autorização por página/ação, senhas com hash seguro, rate-limit em login/recuperação.
- **Nomenclatura do código:** todo o código (arquivos, pastas, variáveis, funções, classes, etc.) deve ser em **inglês (en-US)**.
- **UI (labels/textos visíveis):** deve ser em **pt-BR**.

## Modelo de dados (PostgreSQL)
Crie schema, migrations e seed inicial com Prisma.

Entidades e relações:
1) Barbeiros
2) Agendamentos:
   - data/hora
   - serviço
   - barbeiro
   - status (ex.: PENDENTE | CONFIRMADO | CANCELADO | CONCLUIDO)
3) Disponibilidade:
   - barbeiro
   - serviços
   - **recorrência por período (dia|semana|mês)**
   - **exceções de disponibilidade** (ex.: feriados, folgas, bloqueios)
4) Serviços e Categorias de serviços (N:1)
   - **cada serviço deve ter estimativa média de duração em minutos**
5) Cursos:
   - titulo
   - descricao
   - tipo (PRESENCIAL | ONLINE)
   - cargaHoraria (em horas)
   - status (ATIVO | INATIVO)
6) Produtos e Categorias de produtos (N:1)
7) Usuários, Grupos de usuários e Permissões:
   - usuários (login)
   - grupos (roles)
   - permissões por página e ação: visualizar, adicionar, editar, excluir
   - associe usuário->grupos (N:N) e grupo->permissões (N:N)
8) Configurações do estabelecimento (para admin):
   - horarioFuncionamento
   - linkInstagram
   - endereco (texto)
   - coordenadasMapa (lat/lng) para posicionar marcador no mapa

Inclua índices e constraints para evitar conflitos de agendamento (ex.: barbeiro+data/hora) e garantir integridade.

## Páginas públicas (Home)
Implemente a página inicial com as seções:
1) Banner fullscreen (100vw x 85vh):
   - 3 banners genéricos
   - slider com animação
   - setas (arrows), dots e suporte a drag/swipe
2) Seção “Sobre a barbearia”:
   - 2 colunas (imagem de um lado, texto do outro)
   - responsivo (empilhar no mobile)
3) Seção com 3 blocos (cards):
   - Serviços
   - Cursos
   - Agendamentos
   - cada card leva para a respectiva página/fluxo
4) Seção Instagram:
   - carregar feed do Instagram do perfil https://www.instagram.com/edbarbearia/
   - **use API oficial (Instagram Graph API)**
5) Seção Mapa (100vw x 70vh):
   - **MVP:** usar **Leaflet + OpenStreetMap (OSM)**.
   - mostrar mapa com marcador da unidade baseado nas informações cadastradas no Admin (lat/lng).
   - **Observação:** não usar o tile server público padrão do OSM como solução de produção com tráfego relevante; prever configuração de tiles via `.env` (ex.: provedor de tiles compatível ou auto-host).
6) Footer/Contato (3 colunas):
   1. Logo
   2. Dados da loja (horário de funcionamento, endereço)
   3. Ícone grande do Instagram com link (carregar dinamicamente do Admin)

## Admin
- Implementar CRUD completo para todo o modelo de dados acima (telas e endpoints).
- Implementar menu “Informações do estabelecimento” com:
  - horário de funcionamento
  - link do Instagram
  - endereço
  - definir/atualizar ponto no mapa (lat/lng)
- Autenticação:
  - Login
  - Recuperação de senha (token + expiração)
  - **E-mail:** usar **Resend** como provedor primário, com **fallback SMTP** configurável via variáveis de ambiente (ver `docs/ENV.md`).
- Autorização:
  - RBAC por página e por ação (visualizar/adicionar/editar/excluir)
  - negar acesso por padrão, permitir conforme permissão
- Layout do admin:
  - usar como referência o template “nextjs-admin-dashboard-main”
  - criar sidebar, header, breadcrumbs e páginas padronizadas

## Regras de agendamento (mínimo)
- Mostrar disponibilidade por barbeiro/serviço/data.
- Impedir horários conflitantes (constraint + checagem transacional).
- Status do agendamento com transições controladas.
- Usar a **duração média (minutos)** do serviço para calcular ocupação/slots.

## Arquitetura e organização
- Estruture pastas de forma clara (app/, components/, lib/, prisma/, services/, repositories/).
- Use Server Actions ou Route Handlers no Next.js para operações de escrita, com validação Zod.
- Crie componentes UI reutilizáveis.
- Garanta carregamento eficiente (SSR/ISR quando fizer sentido, caching, suspense).

## Entregáveis
1) Estrutura de projeto completa com comandos de setup (pnpm ou npm), .env.example e documentação rápida (README).
2) Prisma schema + migrations + seed.
3) Rotas/páginas públicas (Home + páginas base de Serviços/Cursos/Agendamento).
4) Admin completo com CRUD, autenticação, RBAC e página de configurações.
5) UI responsiva com Tailwind.
6) Testes mínimos (unitários para validações e integração básica para auth/RBAC).
7) Checklist de melhorias futuras.
8) **Criar pasta `/docs`** com informações relevantes para continuidade do projeto por IA (arquitetura, decisões, comandos, variáveis de ambiente, fluxos principais).

## Variáveis de ambiente (.env)
Além de criar `.env.example`, inclua no repositório a documentação de variáveis em `docs/ENV.md`.

Use este **modelo de `.env`** (não commitar `.env` com segredos reais; commitar apenas `.env.example`):

```dotenv
# App
APP_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-secret

# Database (PostgreSQL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

# Email (Password Recovery)
# Primary provider: Resend. Fallback: SMTP.
EMAIL_PROVIDER=resend

# Resend (primary)
RESEND_API_KEY=replace-with-resend-api-key
EMAIL_FROM="ED Barbearia <no-reply@yourdomain.com>"

# SMTP (fallback) - e.g. Mailpit local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="ED Barbearia <no-reply@localhost>"

# Instagram (Graph API)
INSTAGRAM_ACCESS_TOKEN=replace-with-instagram-access-token
INSTAGRAM_USER_ID=replace-with-instagram-user-id

# Maps (Leaflet + OSM)
# Use `NEXT_PUBLIC_*` for browser-side config.
NEXT_PUBLIC_MAP_DEFAULT_LAT=-23.55052
NEXT_PUBLIC_MAP_DEFAULT_LNG=-46.633308
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=15
# Optional: configure a tile URL for production instead of relying on public OSM tiles.
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© OpenStreetMap contributors
```

## Fluxo de implementação e commits (obrigatório)
Não implemente tudo de uma vez. Trabalhe **gradativamente** e faça commits pequenos e revisáveis.

Regras:
1) **Uma etapa = um commit** (ou poucos commits) com escopo claro (ex.: `chore: bootstrap next+tailwind`, `feat: prisma schema + migrations`, `feat(admin): auth login`).
2) Cada commit deve incluir:
   - alterações mínimas necessárias para a etapa;
   - atualização correspondente em `/docs` (decisões, env, comandos, etc.);
   - build/lint passando.
3) Antes de iniciar uma etapa nova, finalize a anterior com commit e descreva no commit message o que foi entregue.

### Plano em etapas sugerido (para guiar os commits)
1) **Bootstrap (commit 1)**
   - Next.js + Tailwind + TypeScript + ESLint/Prettier
   - Estrutura inicial de pastas e convenções
   - `/docs` inicial + `.env.example`

2) **Infra de dados (commit 2)**
   - Prisma + conexão PostgreSQL
   - Schema inicial + migrations + seed
   - Documentação atualizada em `/docs`

3) **Auth + password recovery (commit 3)**
   - Login
   - Recuperação de senha (Resend primário + fallback SMTP)
   - Rate-limit básico

4) **RBAC (commit 4)**
   - Grupos + permissões
   - Proteção por rota e ação (default deny)

5) **Admin shell (commit 5)**
   - Layout do admin inspirado no template `nextjs-admin-dashboard-main`
   - Navegação/Sidebar/Header/Breadcrumbs + scaffolds de páginas

6) **CRUDs por domínio (vários commits; 1 entidade por commit)**
   - Serviços + categorias (inclui duração em minutos)
   - Barbeiros
   - Disponibilidade + exceções
   - Agendamentos (status e regras)
   - Produtos + categorias
   - Cursos
   - Configurações do estabelecimento (horário, endereço, instagram, lat/lng)

7) **Site público (commits separados por seção)**
   - Home (slider, sobre, cards)
   - Instagram (Graph API)
   - Mapa (Leaflet + OSM, coords do admin)
   - Footer dinâmico

8) **Reservas (commit(s))**
   - Fluxo de criação de agendamento com validações e prevenção de conflito

9) **Testes + hardening (commit final)**
   - Unit/integration essenciais
   - Revisão de segurança/performance

## Respostas já definidas (não perguntar novamente)
- Duração dos serviços: cada serviço cadastrado tem **estimativa média de duração em minutos**.
- Disponibilidade: **recorrente (dia|semana|mês)** e pode adicionar **exceções**.
- Multi-unidade: **apenas uma**.
- Idioma/locale: **UI em pt-BR**, **código em inglês (en-US)**.
- Feed do Instagram: **usar API**.
- Pagamentos: **não haverá**, apenas **reservas**.
- Provedor de e-mail (recuperação): **Resend + fallback SMTP**.
- Provedor de mapas (MVP): **Leaflet + OpenStreetMap (OSM)**.

## Execução
1) Faça apenas as perguntas restantes, se necessário, para fechar detalhes técnicos (ex.: modelagem exata da recorrência/exceções e limites de disponibilidade/slots).
2) Siga o **plano em etapas** e realize commits gradativos.
3) Só então comece a implementar.