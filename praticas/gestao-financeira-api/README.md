# 💰 gestao-financeira-api

API REST do projeto **Gestão Financeira** — backend que serve o app Expo [`gestao-financeira/`](../gestao-financeira/).

Stack: **Node.js + Express + Prisma ORM + MySQL + Zod + JWT + bcryptjs**.

---

## 📦 Dependências

| Pacote | Função |
| :--- | :--- |
| `express` | Framework HTTP. |
| `cors` | Libera chamadas do app Expo. |
| `dotenv` | Carrega `.env`. |
| `zod` | Validação dos payloads. |
| `bcryptjs` | Hash da senha do usuário. |
| `jsonwebtoken` | Emite/valida tokens JWT. |
| `@prisma/client` | Cliente ORM (MySQL). |
| `prisma` *(dev)* | CLI do ORM. |
| `nodemon` *(dev)* | Hot-reload do servidor. |

---

## 🧰 Pré-requisitos

- **Node.js 18+**
- **MySQL 8** em `localhost:3306`
- Banco criado:
  ```sql
  CREATE DATABASE gestao_financeira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

---

## 🚀 Setup do zero

```bash
npm install

# Crie o .env a partir do exemplo (ajuste DATABASE_URL e JWT_SECRET):
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac

#   DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/gestao_financeira"
#   PORT=3000
#   JWT_SECRET="<32+ chars aleatórios>"
#   JWT_EXPIRES_IN="7d"

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

> ⚠️ Se `DATABASE_URL` ou `JWT_SECRET` faltarem no `.env`, o servidor encerra no boot
> com a lista das variáveis ausentes. Isso é proposital — evita silently retornar 500
> nas rotas (ex.: o `/auth/register` quebraria ao assinar o token).

API responde em `http://localhost:3000`.
Health: `GET /` → `{ "ok": true, "name": "gestao-financeira-api" }`.

---

## 📜 Scripts

| Script | O que faz |
| :--- | :--- |
| `npm run dev` | Sobe com `nodemon`. |
| `npm start` | Sobe em produção (`node`). |
| `npm run prisma:migrate` | `prisma migrate dev`. |
| `npm run prisma:seed` | Roda `prisma/seed.js`. |
| `npm run prisma:studio` | Prisma Studio em `localhost:5555`. |

---

## 🗂️ Estrutura

```
gestao-financeira-api/
├── 📁 prisma
│   ├── 📁 migrations
│   ├── 📄 schema.prisma     # User, Category, Transaction
│   └── 📄 seed.js           # 5 categorias padrão + usuário demo
├── 📁 postman
│   └── 📄 collection.json   # Collection oficial para testes
├── 📁 src
│   ├── 📁 lib/prisma.js
│   ├── 📁 middlewares
│   │   ├── auth.js          # JWT Bearer
│   │   └── errorHandler.js  # Zod + Prisma (P2002/P2025/P2003)
│   ├── 📁 routes
│   │   ├── auth.js          # /auth/register, /login, /me
│   │   ├── categories.js    # CRUD (delete bloqueia isDefault)
│   │   └── transactions.js  # CRUD + /summary + filtros mês/ano
│   ├── 📁 schemas
│   │   ├── authSchema.js
│   │   ├── categorySchema.js
│   │   └── transactionSchema.js
│   └── 📄 server.js
├── ⚙️ .env
├── ⚙️ package.json
└── 📝 README.md
```

---

## 🧱 Modelo de dados

### `User`
| Campo | Tipo |
| :--- | :--- |
| `id` | `Int` PK |
| `name` | `String` |
| `email` | `String` **único** |
| `password` | `String` (hash bcrypt) |
| `createdAt` / `updatedAt` | auto |

### `Category`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `name` | `String` | slug **único** (`income`, `food`, …) |
| `displayName` | `String` | nome amigável |
| `icon` | `String?` | nome do ícone (Material) |
| `background` | `String?` | hex `#RRGGBB` |
| `isIncome` | `Boolean` | receita (`true`) ou despesa (`false`) |
| `isDefault` | `Boolean` | bloqueia exclusão se `true` |

Seed cria 5 padrão: `income`, `food`, `transport`, `leisure`, `others`.

### `Transaction`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `description` | `String` | obrigatório |
| `value` | `Decimal(12,2)` | positivo |
| `date` | `DateTime` | default `now()` |
| `notes` | `String?` | opcional |
| `categoryId` | `Int` | FK → `Category.id` |

Índices em `categoryId` e `date`.

---

## 🛣️ Rotas

> Todas as rotas (exceto `/`, `/auth/register`, `/auth/login`) exigem **`Authorization: Bearer <token>`**.

### Health
- `GET /` → `{ ok: true, name: "gestao-financeira-api" }`

### Auth — `/auth`
| Método | Path | Body | Retorno |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `{ name, email, password }` | `201 { user, token }` |
| `POST` | `/auth/login` | `{ email, password }` | `200 { user, token }` |
| `GET` | `/auth/me` | — | `200 user` |

### Categorias — `/categories`
| Método | Path | Notas |
| :--- | :--- | :--- |
| `GET` | `/categories[?isIncome=true|false]` | lista (default primeiro) |
| `GET` | `/categories/:id` | |
| `POST` | `/categories` | `{ name, displayName, icon?, background?, isIncome? }` |
| `PUT` | `/categories/:id` | parcial |
| `DELETE` | `/categories/:id` | **400** se `isDefault` |

### Transações — `/transactions`
| Método | Path | Notas |
| :--- | :--- | :--- |
| `GET` | `/transactions[?categoryId=&isIncome=&month=&year=&from=&to=]` | inclui `category` |
| `GET` | `/transactions/summary[?month=&year=]` | `{ income, expense, balance, byCategory[] }` |
| `GET` | `/transactions/:id` | |
| `POST` | `/transactions` | `{ description, value, date?, notes?, categoryId }` |
| `PUT` | `/transactions/:id` | parcial |
| `DELETE` | `/transactions/:id` | |

---

## ⚠️ Erros

| Status | Quando | Body |
| :--- | :--- | :--- |
| `400` | Zod inválido | `{ error: "Dados inválidos", details: [{path, message}] }` |
| `400` | `categoryId` inexistente (`P2003`) | `{ error: "Categoria informada não existe" }` |
| `400` | Tentou excluir default | `{ error: "Categorias padrão não podem ser excluídas" }` |
| `401` | Sem/Token inválido | `{ error: "Token não fornecido / inválido ou expirado" }` |
| `401` | Login | `{ error: "Credenciais inválidas" }` |
| `404` | Não encontrado | `{ error: "..." }` |
| `409` | Duplicado | `{ error: "Registro duplicado", target }` |
| `500` | Erro interno | `{ error: "Erro interno do servidor" }` |

---

## 📮 Postman

A collection oficial fica em [`postman/collection.json`](./postman/collection.json).

**Importar:** Postman → Import → arrastar o arquivo. A collection já traz:
- variável `baseUrl = http://localhost:3000`
- requisição **Auth - Login** que captura `{{token}}` automaticamente em `collectionVariables`
- todas as outras requisições já usam `Authorization: Bearer {{token}}`

**Roteiro de testes (na ordem):**
1. `Health-check` → confirma `ok: true`.
2. `Auth - Register` → cria `postman@gestao.com` (ou 409 se já existir).
3. `Auth - Login` → captura `token`.
4. `Categories - List` → captura `categoryId` da `income`.
5. `Categories - Create` → cria `health` (Saúde).
6. `Categories - Update` → renomeia para "Saúde e Bem-estar".
7. `Categories - Delete (custom)` → 204.
8. `Categories - Delete default` → **400** "Categorias padrão não podem ser excluídas".
9. `Transactions - Create` → cria "Salário de outubro" usando `{{categoryId}}`.
10. `Transactions - List` / `Transactions - Summary`.
11. `Transactions - Delete` → 204.
12. `Validação - body inválido` → **400** com `error: "Dados inválidos"` + `details`.

---

## 🔌 Conexão com o app Expo

No app [`gestao-financeira/`](../gestao-financeira/) crie `.env`:

- **Emulador Android** → `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- **Celular físico** → `EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:3000`
  - `ipconfig` → IPv4
  - PC e celular no mesmo Wi-Fi
  - Firewall: libere Node.js em rede privada

---

## 👤 Conta de teste (seed)

```
email:    demo@gestao.com
senha:    demo123
```
