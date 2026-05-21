# 📱 gestao-financeira (App)

App mobile do projeto **Gestão Financeira** — React Native (Expo) que consome a API [`gestao-financeira-api/`](../gestao-financeira-api/).

Stack: **Expo + React Native + Context API + AsyncStorage + react-native-chart-kit + JWT**.

Multi-usuário: cada conta vê só suas próprias categorias customizadas e transações; as 5 categorias padrão são compartilhadas. O servidor força o escopo via JWT — frontend nunca pode burlar.

---

## ✨ Funcionalidades

- 🔐 **Login e cadastro** — autenticação via API (JWT em AsyncStorage).
- 🔄 **Auto-logout em 401** — token expirado/inválido encerra a sessão automaticamente e volta pro Login.
- 👋 **Boas-vindas** com nome do usuário autenticado no topo e no Dashboard.
- 📅 **Filtro de mês/ano** nas listas de transações e no resumo.
- 📊 **Dashboard** com cards (Receitas / Despesas / Saldo) + **gráfico de pizza** de despesas por categoria.
- ✏️ **Editar e excluir transações** via **toque longo** (modal de edição).
- 🏷️ **Categorias customizadas** além das 5 padrão (paleta de cores; cadeado 🔒 nas padrão).
- 🌐 Conexão configurável por `.env` (emulador e celular físico).

---

## 🧰 Pré-requisitos

- **Node.js 18+**
- **API rodando** em `http://localhost:3000` (ver [`gestao-financeira-api`](../gestao-financeira-api/)).
- Para testar:
  - **Emulador Android** (Android Studio AVD), **ou**
  - **Expo Go** no celular (mesmo Wi-Fi do PC).

---

## 🚀 Setup do zero

```bash
npm install

# Cria .env a partir do exemplo:
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac
# edite o valor de EXPO_PUBLIC_API_URL conforme seu ambiente (emulador x físico)

npx expo start
# pressione "a" para abrir no emulador Android
# ou escaneie o QR Code no Expo Go
```

> ⚠️ Suba a API **antes** de abrir o app — caso contrário aparecerá `API: Network request failed` no topo. Com o timeout de 10s configurado em `services/api.js`, requests não ficam pendurados indefinidamente.

---

## 🌐 `.env`

Variáveis precisam ter prefixo `EXPO_PUBLIC_` para serem expostas ao bundle. Use [`.env.example`](./.env.example) como base.

### Emulador Android
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Celular físico (Expo Go)
```
EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:3000
```
- `ipconfig` → procurar `Endereço IPv4` (ex.: `192.168.0.47`).
- PC e celular no **mesmo Wi-Fi**.
- Libere Node.js no Firewall (rede privada).

> 🔁 Após mudar o `.env`, **pare e reinicie** `npx expo start`.

---

## 📜 Scripts

| Script | O que faz |
| :--- | :--- |
| `npm start` / `npx expo start` | Sobe o Metro. |
| `npm run android` | Abre direto no emulador. |
| `npm run ios` | Apenas macOS. |
| `npm run web` | Versão web. |

---

## 🗂️ Estrutura

```
gestao-financeira/
├── 📁 assets
├── 📁 src
│   ├── 📁 components
│   │   ├── TabBar.jsx
│   │   ├── MonthYearFilter.jsx     # Chips horizontais de mês/ano
│   │   └── TransactionModal.jsx    # Modal criar/editar transação
│   ├── 📁 contexts
│   │   ├── AuthContext.jsx         # JWT + AsyncStorage + handler 401
│   │   └── GlobalState.jsx         # Categorias/Transações/Summary/Filtros
│   ├── 📁 screens
│   │   ├── LoginScreen.jsx
│   │   ├── RegisterScreen.jsx
│   │   ├── DashboardScreen.jsx     # Welcome + pie chart + recentes
│   │   ├── TransactionsScreen.jsx  # FAB + long-press
│   │   └── CategoriesScreen.jsx
│   └── 📁 services
│       └── api.js                  # Cliente HTTP com token + timeout + 401 callback
├── 📄 App.js                       # SafeArea + Auth gate + tabs
├── ⚙️ .env                         # gitignored
├── ⚙️ .env.example
└── 📝 README.md
```

---

## 🧠 Arquitetura

### `services/api.js`
Wrapper sobre `fetch` com:
- URL base via `EXPO_PUBLIC_API_URL`
- **Timeout de 10s** (via `AbortController`) — não trava em API offline
- **Token JWT injetado automaticamente** (`setAuthToken`)
- **Callback de 401** (`setOnUnauthorized`) — invocado quando token expira
- Tratamento padrão de erro (lança `Error` com `status` e `details` do backend)
- Query-string para filtros (`month`, `year`, `categoryId`, `isIncome`, `from`, `to`)

### `contexts/AuthContext.jsx`
Mantém `user`, `token`, `isAuthenticated`. Persiste em `AsyncStorage` (chaves `@gestao-financeira:token` e `@gestao-financeira:user`). Expõe `login`, `register`, `logout`. Registra `setOnUnauthorized(logout)` — qualquer 401 da API derruba a sessão automaticamente.

### `contexts/GlobalState.jsx`
Estado global escopado pela sessão: `categories`, `transactions`, `summary` (`{ income, expense, balance, byCategory[] }`) e `filter` (`{ month, year }`). Recarrega ao mudar o filtro e zera ao deslogar. Atualização otimista nas mutações + refresh do summary.

### `App.js`
Composição: `SafeAreaProvider → AuthProvider → AuthGate`. Quando autenticado: `GlobalStateProvider → AppShell` (header + tabs + telas). O `GlobalStateProvider` é desmontado no logout, garantindo que o próximo usuário receba estado limpo.

---

## 🧪 Fluxo de teste multi-user

1. Sobe a API ([instruções](../gestao-financeira-api/README.md)).
2. Sobe o app: `npx expo start` → `a` (emulador) ou QR Code.
3. **Login** com `demo@gestao.com` / `demo123` (criado pelo seed).
4. Aba **Categorias** → crie "Mercado" (Despesa, cor vermelha).
5. Aba **Transações** → `+ Nova transação` → "Compra do mês" R$ 350,00 (Despesa → Mercado).
6. Aba **Início** → cards atualizados, gráfico de pizza com fatia de Mercado.
7. **Sair** (header) → confirma → volta para Login.
8. **Cadastre uma nova conta** (qualquer email novo) → entra:
   - **Categorias = só as 5 padrão** (Receita, Alimentação, Transporte, Lazer, Outros).
   - **Transações = 0**.
   - Não vê "Mercado" nem a transação do demo. ✅ Escopo funciona.
9. Crie categoria e transação no novo usuário.
10. Sai → loga de volta no demo → vê **só** as suas, **sem** as do novo.
11. Long-press numa transação sua → Editar / Excluir.
12. Tente excluir "Receita" (padrão) → cadeado 🔒, alerta "padrão não podem ser excluídas".

---

## 🩹 Troubleshooting

| Sintoma | Causa | Resolução |
| :--- | :--- | :--- |
| Barra vermelha "Network request failed" | API offline ou URL errada. | Suba a API; revise `.env`; reinicie Expo. |
| "Tempo esgotado ao chamar a API…" | API parou ou IP inacessível. | Subir API; checar Wi-Fi e Firewall. |
| Voltou pra tela de Login sozinho | Token expirou (default 7d) → auto-logout. | Faça login de novo. |
| "Credenciais inválidas" | Senha errada ou conta inexistente. | Use `demo@gestao.com` / `demo123` ou cadastre. |
| Funciona no emulador, falha no celular | IP do `.env`. | Use IP da LAN; libere Firewall. |
| `EXPO_PUBLIC_API_URL não definida` | Falta `.env` ou prefixo. | Cria `.env` (use `.env.example`) e reinicia Metro. |
| "System UI isn't responding" | RAM baixa no AVD. | AVD: RAM ≥ 2048 MB + Cold Boot Now. |
| Gráfico não aparece | Sem despesas no mês filtrado. | Cadastre uma transação de despesa no mês selecionado. |
| Long-press não dispara | Toque rápido demais. | Segure ~300ms na linha. |
| Não vejo categoria/transação que criei em outra conta | Comportamento esperado: dados são privados por usuário. | Volte pra conta dona. |

---

## 🔗 Links

- 📦 [Backend (`gestao-financeira-api`)](../gestao-financeira-api/)
- 📚 [Expo](https://docs.expo.dev)
- 🧩 [React Native](https://reactnative.dev/docs/getting-started)
- 📈 [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
