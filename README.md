# Portfolio — Express API (TypeScript + Prisma + PostgreSQL + Zod + JWT + pino + prom-client)

API de portfólio construída com **Express 5 + TypeScript**, **Prisma (PostgreSQL)**, **Zod** para validação, **JWT** para autenticação, **pino** para logs estruturados, **prom-client** para métricas Prometheus e **Swagger UI** servindo um `openapi.json`. Projeto organizado em camadas simples, com scripts de verificação e testes automatizados.

> Objetivo: demonstrar **boas práticas sênior** para serviços HTTP com Express — setup rápido, DX forte, validação robusta, observabilidade básica e testes do fluxo crítico.

---

## Sumário
- [Stack & Principais Decisões](#stack--principais-decisões)
- [Arquitetura & Convenções](#arquitetura--convenções)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Rodar (Local)](#como-rodar-local)
- [Rotas Principais](#rotas-principais)
- [Autenticação (JWT)](#autenticação-jwt)
- [CRUD: Items](#crud-items)
- [Métricas & Observabilidade](#métricas--observabilidade)
- [Swagger / OpenAPI](#swagger--openapi)
- [Scripts](#scripts)
- [Testes](#testes)
- [Verificações Offline](#verificações-offline)
- [Postman](#postman)
- [Troubleshooting](#troubleshooting)

---

## Stack & Principais Decisões
- **Express 5 + TypeScript**: framework minimalista e previsível.
- **Prisma ORM + PostgreSQL**: produtividade e migrações versionadas.
- **Zod**: validação declarativa e tipada nos DTOs.
- **Auth JWT**: autenticação stateless, simples para o portfólio.
- **pino/pino-http**: logs estruturados, legíveis no dev com `pino-pretty`.
- **prom-client**: endpoint de métricas (`/api/metrics`) pronto para scrape.
- **Swagger UI**: `/api/docs` lendo `src/docs/openapi.json` (customizável).

---

## Arquitetura & Convenções
- **Camadas**:
  - `routes/` → controladores/handlers HTTP.
  - `middleware/` → transversais (auth, error-handler, logging HTTP).
  - `prisma.ts` → singleton do `PrismaClient`.
  - `env.ts` → validação do ambiente com **Zod** (falha rápido se inválido).
- **Padrões**:
  - **DTOs** com Zod, respondendo 400 em `ValidationError`.
  - **Erros** centralizados no `error-handler`.
  - **Idempotência** nos scripts e setup.
  - **Config** via `.env` (12-factor).

---

## Estrutura de Pastas
```
portfolio-express-api/
├─ src/
│  ├─ app.ts                    # app Express (CORS, logs, JSON, métricas, Swagger, rotas)
│  ├─ server.ts                 # bootstrap
│  ├─ env.ts                    # validação de env com Zod + dotenv
│  ├─ logger.ts                 # pino + pino-http
│  ├─ prisma.ts                 # PrismaClient singleton
│  ├─ docs/
│  │  └─ openapi.json           # contrato OpenAPI básico
│  ├─ middleware/
│  │  ├─ auth.ts                # requireAuth (JWT)
│  │  └─ error-handler.ts       # tratamento unificado de erros
│  └─ routes/
│     ├─ index.ts               # monta /api/*
│     ├─ health.ts              # GET /api/health
│     ├─ auth.ts                # POST /api/auth/register | /login
│     └─ items.ts               # CRUD /api/items (JWT)
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/               # prisma migrate (gerado)
├─ tests/
│  ├─ health.test.ts
│  ├─ auth_items.test.ts
│  └─ setup.ts
├─ postman/
│  └─ portfolio-express-api.postman_collection.json
├─ docs/
│  ├─ API.md
│  ├─ LOCAL_DEV.md
│  ├─ POSTMAN.md
│  └─ OPENAPI.md
├─ .env.example
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## Variáveis de Ambiente
Crie `.env` a partir do `.env.example`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Gere algo forte: `openssl rand -hex 32`
JWT_SECRET=change-me

# Ajuste conforme seu Postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/portfolio_express?schema=public"
```

> O projeto **falha rápido** se `JWT_SECRET` for curto ou `DATABASE_URL` ausente.

---

## Como Rodar (Local)

```bash
pnpm install
cp .env.example .env   # edite JWT_SECRET e DATABASE_URL
pnpm prisma:generate
pnpm prisma:migrate    # requer Postgres acessível
pnpm dev               # http://localhost:3001
```

- Health:   `GET http://localhost:3001/api/health` → `{"status":"ok"}`  
- Swagger:  `GET http://localhost:3001/api/docs`  
- Métricas: `GET http://localhost:3001/api/metrics`

---

## Rotas Principais

| Recurso        | Método(s)                      | Caminho                  | Auth |
|----------------|--------------------------------|--------------------------|------|
| Health         | `GET`                          | `/api/health`            | —    |
| Swagger UI     | `GET`                          | `/api/docs`              | —    |
| Metrics        | `GET`                          | `/api/metrics`           | —    |
| Auth           | `POST`                         | `/api/auth/register`     | —    |
| Auth           | `POST`                         | `/api/auth/login`        | —    |
| Items          | `GET \| POST`                  | `/api/items`             | ✅    |
| Item por ID    | `GET \| PATCH \| DELETE`       | `/api/items/{id}`        | ✅    |

---

## Autenticação (JWT)
- **Login** (`POST /api/auth/login`) retorna `{ access: <JWT> }` (expira em 30 min).
- **Proteção**: rotas em `items.ts` usam `requireAuth` (header `Authorization: Bearer <token>`).
- **Payload**: `{ sub: user.id, email: user.email }`.
- **Senha**: hash com `bcryptjs` (salt 10).

Exemplo (curl):
```bash
# Registrar
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@example.com","password":"secret123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"secret123"}' | jq -r .access)

# Usar Bearer
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/items
```

---

## CRUD: Items
- **Modelo** (Prisma): `Item { id uuid, name string(120), price decimal(10,2), ownerId uuid }`
- **Validação**: `name` (1..120), `price` positivo (`z.coerce.number().positive()`).
- **Respostas**: `404` quando não encontrado; `400` em validação; `401` sem token.

Exemplo criar:
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Notebook","price":1999.90}'
```

---

## Métricas & Observabilidade
- **Logs**: `pino-http` com `pino-pretty` no modo dev (`logger.ts`).  
- **Prometheus**: `GET /api/metrics` com `collectDefaultMetrics()` (Node/Process).  
- **Sugestões**: adicionar labels de negócio (ex.: contadores de logins, erros 4xx/5xx).

---

## Swagger / OpenAPI
- **UI**: `GET /api/docs` (Swagger UI).
- **Fonte**: `src/docs/openapi.json`.  
  - Edite endpoints, schemas e exemplos conforme evoluir.  
  - Futuro: gerar via `zod-to-openapi` para sincronia com os DTOs.

---

## Scripts
`package.json` (resumo útil):
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:types": "tsc -p tsconfig.json --noEmit",
    "verify:prisma": "prisma format && prisma validate",
    "verify": "pnpm verify:types && pnpm verify:prisma",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## Testes
- **Stack**: Vitest + Supertest.
- **Cobertura**: health e fluxo `auth + items` e2e (mínimo para portfólio).

```bash
pnpm test          # execução única
pnpm test:watch    # modo watch
```

---

## Verificações Offline
Sem tocar no banco:
```bash
pnpm verify        # tsc --noEmit + prisma validate
```
> Dica: `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` é útil para inspecionar diffs de schema.

---

## Postman
Importe `postman/portfolio-express-api.postman_collection.json` e siga:
1. Ajuste `baseUrl` se necessário (default: `http://127.0.0.1:3001`).
2. (Opcional) Rode **Auth • Register**.
3. Rode **Auth • Login** → preenche `{{token}}` automaticamente.
4. Use os requests de **Items** (com Bearer).

---

## Troubleshooting

**JWT_SECRET muito curto**  
→ Gere um segredo forte:
```bash
openssl rand -hex 32 | pbcopy  # macOS
```
Atualize no `.env` e reinicie o servidor.

**P3006 / FK incompatível em migrações**  
→ Tipos divergentes (ex.: `text` vs `uuid`). Corrija o `schema.prisma`, **resete** em dev:
```bash
pnpm exec prisma migrate reset --force --skip-seed
pnpm prisma:migrate --name init
```

**pnpm bloqueou postinstall do Prisma**  
→ Aprove builds e gere client:
```bash
pnpm approve-builds @prisma/client @prisma/engines prisma esbuild
pnpm prisma:generate
```

**DATABASE_URL inválida/sem permissão**  
→ Ajuste usuário/role no Postgres ou use seu usuário local do macOS.

