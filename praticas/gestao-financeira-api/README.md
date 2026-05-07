# 💰 gestao-financeira-api

API REST do projeto **Gestão Financeira** — backend que serve o app Expo [`gestao-financeira/`](../gestao-financeira/).

Stack: **Node.js + Express + Prisma ORM + MySQL + Zod**.

---

## 📦 Stack e dependências

| Pacote | Função |
| :--- | :--- |
| `express` | Framework HTTP. |
| `cors` | Libera chamadas do app Expo (origem diferente). |
| `dotenv` | Carrega variáveis de ambiente do `.env`. |
| `zod` | Validação de payloads (POST/PUT). |
| `@prisma/client` | Cliente do ORM (consulta o MySQL). |
| `prisma` *(dev)* | CLI do ORM (migrations, generate, studio). |
| `nodemon` *(dev)* | Reinicia o servidor a cada alteração no código. |

---

## 🧰 Pré-requisitos

- **Node.js 18+**
- **MySQL 8** rodando em `localhost:3306`
- Banco `gestao_financeira` criado (UTF-8):
  ```sql
  CREATE DATABASE gestao_financeira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

---

## 🚀 Setup do zero

```bash
# 1. Instalar dependências
npm install

# 2. Configurar credenciais em .env
#    DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/gestao_financeira"
#    PORT=3000

# 3. Aplicar migrations (cria tabelas Category e Transaction)
npx prisma migrate dev --name init

# 4. Popular categorias padrão (Salário, Alimentação, etc.)
npm run prisma:seed

# 5. Subir API em modo dev (hot-reload)
npm run dev
```

API responde em **`http://localhost:3000`**. Health check: `GET /` → `{ "name": "gestao-financeira-api", "status": "ok" }`.

---

## 📜 Scripts (`package.json`)

| Script | O que faz |
| :--- | :--- |
| `npm run dev` | Sobe o servidor com `nodemon` (reinicia ao salvar). |
| `npm start` | Sobe o servidor em modo produção (`node`). |
| `npm run prisma:migrate` | Cria/aplica nova migration (`prisma migrate dev`). |
| `npm run prisma:seed` | Executa `prisma/seed.js` (popula categorias). |
| `npm run prisma:studio` | Abre o Prisma Studio (GUI do banco) em `localhost:5555`. |

---

## 🗂️ Estrutura

```
gestao-financeira-api/
├── 📁 prisma
│   ├── 📁 migrations
│   │   ├── 📁 20260507030601_init
│   │   │   └── 📄 migration.sql
│   │   └── ⚙️ migration_lock.toml
│   ├── 📄 schema.prisma         # Modelos Category e Transaction
│   └── 📄 seed.js               # Categorias padrão (upsert idempotente)
├── 📁 src
│   ├── 📁 lib
│   │   └── 📄 prisma.js         # Singleton do PrismaClient
│   ├── 📁 middlewares
│   │   └── 📄 errorHandler.js   # Trata Zod + códigos Prisma (P2002/P2025/P2003)
│   ├── 📁 routes
│   │   ├── 📄 categories.js     # CRUD /categories
│   │   └── 📄 transactions.js   # CRUD /transactions + /summary
│   ├── 📁 schemas
│   │   ├── 📄 categorySchema.js
│   │   └── 📄 transactionSchema.js
│   └── 📄 server.js             # App Express, CORS, JSON, error handler
├── ⚙️ .env                       # DATABASE_URL e PORT (não commitar)
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ package-lock.json
└── ⚙️ package.json
```

---

## 🧱 Modelo de dados

### `enum TransactionType`
- `INCOME` — receita
- `EXPENSE` — despesa

### `Category`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK, auto-incremento |
| `name` | `String` | **único** |
| `type` | `TransactionType` | `INCOME` ou `EXPENSE` |
| `color` | `String?` | Hex (ex.: `#16a34a`) |
| `icon` | `String?` | Nome do ícone |
| `createdAt` / `updatedAt` | `DateTime` | Auto |

### `Transaction`
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `Int` | PK |
| `description` | `String` | obrigatório |
| `amount` | `Decimal(12,2)` | positivo |
| `type` | `TransactionType` | |
| `date` | `DateTime` | default `now()` |
| `notes` | `String?` | opcional |
| `categoryId` | `Int` | FK → `Category.id` |
| `createdAt` / `updatedAt` | `DateTime` | Auto |

Índices em `categoryId` e `date`.

---

## 🛣️ Rotas

Todas as respostas são **JSON**. Erros seguem o formato:
```json
{ "error": "mensagem", "issues": [ /* só em validação Zod */ ] }
```

### Categorias — `/categories`

| Método | Path | Descrição |
| :--- | :--- | :--- |
| `GET` | `/categories` | Lista tudo. Query opcional `?type=INCOME` ou `?type=EXPENSE`. |
| `GET` | `/categories/:id` | Busca por id. |
| `POST` | `/categories` | Cria. Body: `{ name, type, color?, icon? }`. |
| `PUT` | `/categories/:id` | Atualiza parcialmente. |
| `DELETE` | `/categories/:id` | Remove. |

**Exemplo:**
```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Mercado","type":"EXPENSE","color":"#ef4444"}'
```

### Transações — `/transactions`

| Método | Path | Descrição |
| :--- | :--- | :--- |
| `GET` | `/transactions` | Lista (mais recentes primeiro). Filtros: `type`, `categoryId`, `from`, `to`. |
| `GET` | `/transactions/summary` | Retorna `{ income, expense, balance }` agregado. |
| `GET` | `/transactions/:id` | Busca por id (inclui `category`). |
| `POST` | `/transactions` | Cria. Body: `{ description, amount, type, date?, notes?, categoryId }`. |
| `PUT` | `/transactions/:id` | Atualiza parcialmente. |
| `DELETE` | `/transactions/:id` | Remove. |

**Exemplo:**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"description":"Compra do mês","amount":350.50,"type":"EXPENSE","categoryId":4}'
```

---

## ⚠️ Erros mais comuns

| Status | Quando | Resposta |
| :--- | :--- | :--- |
| `400` | Payload inválido (Zod) | `{ error: "Dados inválidos", issues: [...] }` |
| `400` | `categoryId` inexistente (Prisma `P2003`) | `{ error: "Categoria informada não existe" }` |
| `404` | Recurso não existe (`P2025`) | `{ error: "Registro não encontrado" }` |
| `409` | `name` duplicado (`P2002`) | `{ error: "Registro duplicado", target: [...] }` |
| `500` | Erro inesperado | `{ error: "Erro interno do servidor" }` |

---

## 🔌 Conexão com o app Expo

No app [`gestao-financeira/`](../gestao-financeira/), crie `.env`:

- **Emulador Android (Studio)** → `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- **Celular físico via Expo Go** → `EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:3000`
  - `ipconfig` → procurar `Endereço IPv4` (ex.: `192.168.0.47`)
  - PC e celular no mesmo Wi-Fi
  - Liberar Node.js no Firewall (rede privada)

Uso simples:
```js
const API_URL = process.env.EXPO_PUBLIC_API_URL;
fetch(`${API_URL}/categories`).then(r => r.json());
```

---

## 🧪 Testar via Prisma Studio

```bash
npm run prisma:studio
```
Abre GUI em `http://localhost:5555` para inspecionar/editar dados direto no banco.
