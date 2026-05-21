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

## 📮 Postman — guia rápido

Collection em [`postman/collection.json`](./postman/collection.json) — **11 requests** prontas, cada uma com descrição em markdown explicando o que faz, o body, a resposta esperada e o que captura.

A ordem é exatamente a do roteiro do professor: **um passo de Setup (login) + os 10 testes pedidos.**

---

### ✅ Checklist antes de abrir o Postman

- [ ] **MySQL rodando** → `Start-Service MySQL80` (Windows) ou abra o MySQL Workbench.
- [ ] **API rodando** → `cd praticas/gestao-financeira-api && npm run dev` (deve mostrar `API rodando em http://localhost:3000`). Deixe o terminal aberto.
- [ ] **Seed rodado** → `npm run prisma:seed` (uma vez). Cria as 5 categorias padrão + usuário `demo@gestao.com / demo123`.

Sem isso, **nada funciona** no Postman.

---

### 1️⃣ Instalar e abrir o Postman

Escolha uma das opções:

| Onde | Link | Quando usar |
| :--- | :--- | :--- |
| **Postman Desktop** | https://www.postman.com/downloads/ | Recomendado (mais rápido) |
| **Postman Web** | https://web.postman.co | Não quer instalar nada |
| **Extensão VSCode** | Marketplace → "Postman" | Quer tudo dentro do VSCode |

> Pode precisar criar uma conta gratuita.

---

### 2️⃣ Importar a collection

**Postman Desktop / Web:**
1. Botão **Import** (topo esquerdo).
2. Arraste `praticas/gestao-financeira-api/postman/collection.json` na janela.
3. Clique **Import**.

**Extensão VSCode:**
1. `Ctrl+Shift+P` → digite `Postman: Import` → Enter.
2. Selecione o `collection.json`.
3. Escolha a workspace.

Vai aparecer no painel esquerdo a coleção **"Gestão Financeira API"** com 11 requests numeradas (`0.` até `10.`).

---

### 3️⃣ Conferir as variáveis (1 minuto)

Clique no nome da Collection → aba **Variables**. Já vem preenchido:

| Variável | Valor inicial | Para quê serve |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:3000` | URL da API. Mude se sua API estiver em outra porta/host. |
| `token` | *(vazio)* | Preenchido automaticamente pelo passo **0. Login**. |
| `categoryId` | *(vazio)* | Id da categoria `income`, preenchido pelo passo **2**. |
| `customCategoryId` | *(vazio)* | Id da categoria "Saúde", preenchido pelo passo **3**. |
| `transactionId` | *(vazio)* | Id do "Salário de outubro", preenchido pelo passo **7**. |

> Se mudou alguma coisa, clique em **Save** no topo.

---

### 4️⃣ Rodar os passos (na ordem!)

A ordem importa: cada passo usa variáveis capturadas pelos anteriores. Clique em cada request no painel esquerdo e aperte **Send**.

| # | Request | Método | O que esperar |
| :-: | :--- | :-: | :--- |
| **0** | **Setup - Login (rodar 1x antes)** | POST | `200` — captura `{{token}}` |
| **1** | Health-check | GET | `200 {"ok": true, "name": "gestao-financeira-api"}` |
| **2** | Listar categorias (captura income) | GET | `200` com as **5 categorias do seed** — captura `{{categoryId}}` da `income` |
| **3** | Criar categoria (`health` / Saúde) | POST | `201` com `id` gerado — captura `{{customCategoryId}}` |
| **4** | Atualizar categoria | PUT | `200` com `displayName: "Saúde e Bem-estar"` |
| **5** | Excluir categoria custom (204) | DELETE | `204 No Content` |
| **6** | Excluir categoria padrão (esperado 400) | DELETE | `400 {"error": "Categorias padrão não podem ser excluídas"}` |
| **7** | Criar transação ("Salário de outubro") | POST | `201` com `category` aninhada — captura `{{transactionId}}` |
| **8** | Listar transações | GET | `200` array contendo a transação do passo 7 |
| **9** | Excluir transação | DELETE | `204 No Content` |
| **10** | Validar erros (body inválido → 400) | POST | `400 {"error": "Dados inválidos", "details": [...]}` |

---

### 🔎 Como saber se passou

Depois de cada **Send**, olhe a aba **Test Results** no painel de resposta (junto com Body/Headers/Cookies). Cada `pm.test` aparece com:

- 🟢 **PASS** → tudo certo.
- 🔴 **FAIL** → leia a mensagem, abra a aba **Body** pra ver o JSON real da resposta.

Cada request da coleção tem entre 2 e 4 testes assertivos — todos devem ser verdes se o ambiente está OK.

---

### ▶️ Atalho: rodar tudo de uma vez (Collection Runner)

Depois de validar os 10 passos manualmente, dá pra rodar a coleção inteira em sequência:

1. Clique nos `...` ao lado do nome da Collection.
2. **Run collection** → **Run Gestão Financeira API**.
3. Mantém defaults (`Iterations: 1`, `Delay: 0`).
4. Clique **Run**.

Deve abrir um relatório com **todos os passos em verde** (~30 testes).

---

### 🩹 Deu erro? Diagnóstico rápido

| Erro | Causa mais comum | Como resolver |
| :--- | :--- | :--- |
| `Error: connect ECONNREFUSED 127.0.0.1:3000` | API não está rodando. | `npm run dev` na pasta da API. |
| `401 Credenciais inválidas` no passo **0** | Seed não rodou, sem o usuário `demo`. | `npm run prisma:seed`. |
| `401 Token não fornecido` em qualquer passo ≥1 | Esqueceu de rodar o passo **0. Login** primeiro. | Rode o passo 0 e tente de novo. |
| `401 Token inválido ou expirado` | Token expirou (7d) ou `JWT_SECRET` mudou no `.env`. | Rode o passo **0. Login** de novo. |
| `409 Registro duplicado` no passo **3** | Você já criou a categoria `health` antes. | Rode os passos **5** (delete custom) e depois **3** de novo. |
| `400 Categoria informada não existe` no passo **7** | Variável `{{categoryId}}` está vazia. | Rode o passo **2** antes. |
| `Could not get response` | URL ou porta errada no `baseUrl`. | Aba **Variables** da Collection → verifique `baseUrl`. |
| **Test Results** todos vermelhos | Banco zerado / seed não rodou / API caída. | `npm run prisma:seed` + `npm run dev`. |

---

### 🔄 Resetar o banco e começar do zero (opcional)

A coleção é **idempotente** — pode rodar várias vezes seguidas sem problema. Mas se quiser zerar tudo:

> ⚠️ **Comando destrutivo:** `prisma migrate reset` **APAGA TODOS os dados** do banco `gestao_financeira` (usuários, categorias custom, transações). Use SÓ em ambiente local de desenvolvimento.

```powershell
# 1. Pare a API (Ctrl+C no terminal dela)
cd praticas\gestao-financeira-api

# 2. Reset do banco + reaplica migrations
$env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="confirmo reset"
npx prisma migrate reset --force

# 3. Rode o seed (recria 5 categorias padrão + usuário demo)
npm run prisma:seed

# 4. Suba a API de novo
npm run dev
```

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
