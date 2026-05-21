# 💰 gestao-financeira-api

API REST do projeto **Gestão Financeira** — backend que serve o app Expo [`gestao-financeira/`](../gestao-financeira/).

Stack: **Node.js + Express + Prisma ORM + MySQL + Zod + JWT + bcryptjs**.

Multi-usuário: cada conta tem suas próprias transações e categorias customizadas; categorias padrão (`isDefault=true`, `userId=NULL`) são compartilhadas entre todos os usuários.

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

npx prisma migrate dev
npm run prisma:seed
npm run dev
```

API responde em `http://localhost:3000`.
Health: `GET /` → `{ "ok": true, "name": "gestao-financeira-api" }`.

> ⚠️ Se `DATABASE_URL` ou `JWT_SECRET` faltarem no `.env`, o servidor encerra no boot
> com a lista das variáveis ausentes (fail-fast). Isso é proposital — evita silently
> retornar 500 nas rotas (ex.: o `/auth/register` quebraria ao assinar o token).

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
│   ├── 📁 migrations            # 3 migrations versionadas
│   ├── 📄 schema.prisma         # User, Category, Transaction (com userId)
│   └── 📄 seed.js               # 5 categorias padrão (userId=NULL) + usuário demo
├── 📁 postman
│   └── 📄 collection.json       # Collection oficial para testes
├── 📁 src
│   ├── 📁 lib/prisma.js
│   ├── 📁 middlewares
│   │   ├── auth.js              # JWT Bearer (popula req.user)
│   │   └── errorHandler.js      # Zod + Prisma (P2002/P2025/P2003) + err.status
│   ├── 📁 routes
│   │   ├── auth.js              # /auth/register, /login, /me
│   │   ├── categories.js        # CRUD escopado por userId (defaults compartilhadas)
│   │   └── transactions.js      # CRUD escopado por userId + /summary + filtros mês/ano
│   ├── 📁 schemas
│   │   ├── authSchema.js
│   │   ├── categorySchema.js
│   │   └── transactionSchema.js
│   └── 📄 server.js             # fail-fast env, mount routes
├── ⚙️ .env                       # gitignored
├── ⚙️ .env.example               # template
├── ⚙️ package.json
└── 📝 README.md
```

---

## 🧱 Modelo de dados

### `User`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `name` | `String` | |
| `email` | `String` | **único** |
| `password` | `String` | hash bcrypt |
| `categories` / `transactions` | relação | criadas pelo usuário |
| `createdAt` / `updatedAt` | auto | |

### `Category`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `name` | `String` | slug — **único por usuário** (`@@unique([name, userId])`) |
| `displayName` | `String` | nome amigável |
| `icon` | `String?` | nome do ícone (Material) |
| `background` | `String?` | hex `#RRGGBB` |
| `isIncome` | `Boolean` | receita (`true`) ou despesa (`false`) |
| `isDefault` | `Boolean` | `true` em padrão (bloqueia edição/exclusão) |
| `userId` | `Int?` | **`NULL` = padrão (visível a todos); preenchido = privada do criador** |

Seed cria 5 padrão com `userId=NULL`: `income`, `food`, `transport`, `leisure`, `others`.

### `Transaction`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `description` | `String` | obrigatório |
| `value` | `Decimal(12,2)` | positivo |
| `date` | `DateTime` | default `now()` |
| `notes` | `String?` | opcional |
| `categoryId` | `Int` | FK → `Category.id` |
| `userId` | `Int` | **FK → `User.id` (obrigatório, escopo do dono)** |

Índices em `categoryId`, `userId` e `date`. `onDelete: Cascade` em `User → Transaction` (apagar usuário apaga transações).

---

## 🔒 Modelo de visibilidade (multi-user)

| Recurso | Quem vê | Quem edita | Quem deleta |
| :--- | :--- | :--- | :--- |
| Categoria padrão (`isDefault=true`, `userId=NULL`) | todos autenticados | ninguém (403) | ninguém (400) |
| Categoria custom (`userId=X`) | só o dono `X` | só `X` (403 se outro) | só `X` (403 se outro) |
| Transação | só o dono | só o dono (403) | só o dono (403) |

Servidor força esse escopo em todas as queries usando `req.user.id` do JWT — frontend nunca pode burlar.

---

## 🛣️ Rotas

> Todas (exceto `/`, `/auth/register`, `/auth/login`) exigem **`Authorization: Bearer <token>`**.
> 401 sem token / token inválido / expirado.

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
| `GET` | `/categories[?isIncome=true|false]` | retorna defaults + customs do usuário (defaults primeiro) |
| `GET` | `/categories/:id` | só se visível ao usuário |
| `POST` | `/categories` | `{ name, displayName, icon?, background?, isIncome? }` — cria com `userId = req.user.id`, `isDefault=false` |
| `PUT` | `/categories/:id` | parcial. **403** se for padrão (não editável) ou se não for o dono |
| `DELETE` | `/categories/:id` | **400** se for padrão. **403** se não for o dono. Senão **204**. |

### Transações — `/transactions`
| Método | Path | Notas |
| :--- | :--- | :--- |
| `GET` | `/transactions[?categoryId=&isIncome=&month=&year=&from=&to=]` | só transações do usuário; inclui `category` |
| `GET` | `/transactions/summary[?month=&year=]` | `{ income, expense, balance, byCategory[] }` escopado |
| `GET` | `/transactions/:id` | 404 se não for do usuário |
| `POST` | `/transactions` | `{ description, value, date?, notes?, categoryId }` — `userId` injetado do JWT. **400** se a categoria não for visível ao usuário |
| `PUT` | `/transactions/:id` | parcial. **403** se não for o dono |
| `DELETE` | `/transactions/:id` | **403** se não for o dono. Senão **204**. |

---

## ⚠️ Erros

| Status | Quando | Body |
| :--- | :--- | :--- |
| `400` | Zod inválido | `{ error: "Dados inválidos", details: [{path, message}] }` |
| `400` | `categoryId` inexistente/invisível | `{ error: "Categoria informada não existe" }` |
| `400` | Tentou excluir categoria padrão | `{ error: "Categorias padrão não podem ser excluídas" }` |
| `401` | Sem/Token inválido/expirado | `{ error: "Token não fornecido / inválido ou expirado" }` |
| `401` | Login com credencial errada | `{ error: "Credenciais inválidas" }` |
| `403` | Editou/excluiu recurso de outro usuário | `{ error: "Você não pode editar/excluir essa categoria/transação" }` |
| `403` | Tentou editar categoria padrão | `{ error: "Categorias padrão não podem ser editadas" }` |
| `404` | Não encontrado | `{ error: "..." }` |
| `409` | E-mail duplicado em /auth/register | `{ error: "E-mail já cadastrado" }` |
| `409` | `name+userId` duplicado em /categories | `{ error: "Registro duplicado", target }` |
| `500` | Erro interno | `{ error: "Erro interno do servidor" }` |

---

## 📮 Postman — passo a passo

Collection oficial em [`postman/collection.json`](./postman/collection.json). 17 requisições com testes assertivos (`pm.test`) e encadeamento automático de variáveis (`token`, `categoryId`, `customCategoryId`, `transactionId`, `tokenSecondary`).

### 1. Instalar / abrir Postman

- Baixe em https://www.postman.com/downloads/ (versão Desktop) **ou** use a versão Web em https://web.postman.co.
- Faça login (ou pule, se a versão permitir).

### 2. Subir a API antes de tudo

```powershell
cd praticas\gestao-financeira-api
npm run dev
```

Deve aparecer `API rodando em http://localhost:3000`. **Deixe o terminal aberto.**

### 3. Importar a collection

1. No Postman, clique em **Import** (canto superior esquerdo, ou `Ctrl+O`).
2. Arraste o arquivo `praticas/gestao-financeira-api/postman/collection.json` para a janela.
3. Clique em **Import** e confirme.
4. Aparecerá no painel esquerdo uma coleção chamada **"Gestão Financeira API"**.

### 4. Conferir as variáveis da collection

1. Clique no nome da collection → aba **Variables**.
2. Deve ter:
   | Variável | Valor inicial | Função |
   | :--- | :--- | :--- |
   | `baseUrl` | `http://localhost:3000` | URL da API local |
   | `token` | *(vazio)* | Preenchido pelo `Auth - Login` |
   | `tokenSecondary` | *(vazio)* | Preenchido pelo segundo login (testes multi-user) |
   | `categoryId` | *(vazio)* | Id da `income` capturado em `Categories - List` |
   | `customCategoryId` | *(vazio)* | Id da categoria custom criada |
   | `transactionId` | *(vazio)* | Id da transação criada |
3. Se for testar contra outro host (ex.: API hospedada), troque o `baseUrl` na coluna **Current Value** e clique em **Save**.

### 5. Rodar request por request (recomendado na primeira vez)

A ordem **importa** — os testes capturam variáveis que as requisições seguintes consomem.

| # | Request | Esperado |
| :-: | :--- | :--- |
| 1 | `Health-check` | `200 { "ok": true, "name": "gestao-financeira-api" }` |
| 2 | `Auth - Register` | `201` (cria `postman@gestao.com`) ou `409` se já existia |
| 3 | `Auth - Login` | `200` — **captura `{{token}}` automaticamente** |
| 4 | `Auth - Me` | `200` retornando dados do usuário logado |
| 5 | `Categories - List` | `200` com ≥5 categorias; **captura `{{categoryId}}` da `income`** |
| 6 | `Categories - Create` | `201` criando `health` com `isDefault=false`; **captura `{{customCategoryId}}`** |
| 7 | `Categories - Update` | `200` renomeando para "Saúde e Bem-estar" |
| 8 | `Categories - Delete (custom)` | `204 No Content` |
| 9 | `Categories - Delete default` | `400 "Categorias padrão não podem ser excluídas"` |
| 10 | `Transactions - Create` | `201` com `category` aninhada; **captura `{{transactionId}}`** |
| 11 | `Transactions - List` | `200` listando a transação criada |
| 12 | `Transactions - Summary` | `200 { income, expense, balance, byCategory[] }` |
| 13 | `Transactions - Delete` | `204 No Content` |
| 14 | `Validação - body inválido` | `400 { error: "Dados inválidos", details: [...] }` |
| 15 | `Multi-user - Register secundário` | `201` ou `409` (cria `postman-2@gestao.com`) |
| 16 | `Multi-user - Login secundário` | `200` — **captura `{{tokenSecondary}}`** |
| 17 | `Multi-user - Categorias do secundário` | `200` retornando **só as 5 padrão** (0 customs) |
| 18 | `Multi-user - Transações do secundário` | `200 []` (lista vazia, isolamento provado) |

**Como executar uma request:**
1. Clique na request no painel esquerdo.
2. Clique no botão azul **Send** (canto superior direito).
3. Olhe o painel inferior:
   - **Body** → resposta JSON da API.
   - **Test Results** (aba ao lado de Body/Headers) → mostra `✔ PASS` ou `✘ FAIL` para cada `pm.test`.
   - Cada request marca seus próprios testes como verde/vermelho na lista do menu lateral.

### 6. Rodar tudo de uma vez (Collection Runner)

Quando já validar manualmente, dá pra rodar a coleção inteira em sequência.

1. Clique nos `...` ao lado do nome da collection no painel esquerdo.
2. Selecione **Run collection**.
3. Na tela do Runner:
   - **Iterations:** `1`
   - **Delay:** `0` ms (ou `100` se quiser ver passar mais devagar)
   - **Data:** vazio
   - **Persist responses for a session:** ✓ (opcional, ajuda a debugar)
4. Clique **Run Gestão Financeira API**.
5. Veja o relatório: cada request com seus testes em verde. Deve dar **PASS em tudo**.

### 7. Limpar entre execuções

A collection é idempotente — pode rodar várias vezes seguidas. Mas se quiser começar do zero:

```powershell
# Stoppe API (Ctrl+C no terminal dela)
cd praticas\gestao-financeira-api

# Reseta o banco (apaga tudo + reaplica migrations + roda seed)
$env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="confirmo reset"
npx prisma migrate reset --force

# Sobe API de novo
npm run dev
```

> ⚠️ `migrate reset` **apaga todos os dados** do banco `gestao_financeira` (usuários, categorias custom, transações). Use só em ambiente de desenvolvimento.

### 8. Erros comuns no Postman

| Sintoma | Causa | Como resolver |
| :--- | :--- | :--- |
| `Error: connect ECONNREFUSED 127.0.0.1:3000` | API não está rodando. | `npm run dev` no diretório da API. |
| `401 Token não fornecido` em qualquer rota | Esqueceu de rodar `Auth - Login` antes. | Rode `Auth - Login`, depois a request que falhou. |
| `401 Token inválido ou expirado` | Token muito antigo (expirou em 7d) ou `JWT_SECRET` mudou. | Rode `Auth - Login` de novo. |
| `409 E-mail já cadastrado` em `Auth - Register` | Conta já existe no banco. | Esperado — siga pra `Auth - Login`. |
| `400 Categorias padrão não podem ser excluídas` em qualquer DELETE | Tentou apagar default. | Esperado no teste específico; senão use `{{customCategoryId}}`. |
| `Could not get response` | URL/host errado em `baseUrl`. | Confira **Variables** da collection. |
| Test Results todos vermelhos | Banco vazio ou seed não rodou. | `npm run prisma:seed` na API. |

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
