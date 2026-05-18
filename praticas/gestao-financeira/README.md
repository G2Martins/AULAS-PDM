# 📱 gestao-financeira (App)

App mobile do projeto **Gestão Financeira** — React Native (Expo) que consome a API [`gestao-financeira-api/`](../gestao-financeira-api/).

Stack: **Expo + React Native + Context API + AsyncStorage + react-native-chart-kit + JWT**.

---

## ✨ Funcionalidades

- 🔐 **Login e cadastro** — autenticação via API (JWT em AsyncStorage).
- 👋 **Boas-vindas** com nome do usuário autenticado no topo e no Dashboard.
- 📅 **Filtro de mês/ano** nas listas de transações e no resumo.
- 📊 **Dashboard** com cards (Receitas / Despesas / Saldo) + **gráfico de pizza** de despesas por categoria.
- ✏️ **Editar e excluir transações** via **toque longo** (modal de edição).
- 🏷️ **Categorias customizadas** além das 5 padrão (Receita, Alimentação, Transporte, Lazer, Outros).
  - Padrão são bloqueadas para exclusão (cadeado 🔒).
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

# crie o .env (ver próxima seção)

npx expo start
# pressione "a" para abrir no emulador Android
# ou escaneie o QR Code no Expo Go
```

> ⚠️ Suba a API **antes** de abrir o app — caso contrário aparecerá `API: Network request failed` no topo.

---

## 🌐 `.env`

Variáveis precisam ter prefixo `EXPO_PUBLIC_` para serem expostas ao bundle.

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
│   │   ├── AuthContext.jsx         # JWT + AsyncStorage
│   │   └── GlobalState.jsx         # Categorias/Transações/Summary/Filtros
│   ├── 📁 screens
│   │   ├── LoginScreen.jsx
│   │   ├── RegisterScreen.jsx
│   │   ├── DashboardScreen.jsx     # Welcome + pie chart + recentes
│   │   ├── TransactionsScreen.jsx  # FAB + long-press
│   │   └── CategoriesScreen.jsx
│   └── 📁 services
│       └── api.js                  # Cliente HTTP com token
├── 📄 App.js                       # SafeArea + Auth gate + tabs
├── ⚙️ .env
└── 📝 README.md
```

---

## 🧠 Arquitetura

### `services/api.js`
Wrapper sobre `fetch` com:
- URL base via `EXPO_PUBLIC_API_URL`
- **Token JWT injetado automaticamente** (`setAuthToken`)
- Tratamento padrão de erro (lança `Error` com `status` e `details` do backend)
- Query-string para filtros (`month`, `year`, `categoryId`, `isIncome`, `from`, `to`)

### `contexts/AuthContext.jsx`
Mantém `user`, `token`, `isAuthenticated`. Persiste em `AsyncStorage` (chaves `@gestao-financeira:token` e `@gestao-financeira:user`). Expõe `login`, `register`, `logout`.

### `contexts/GlobalState.jsx`
Estado global de `categories`, `transactions`, `summary` (`{ income, expense, balance, byCategory[] }`) e `filter` (`{ month, year }`). Recarrega automaticamente ao mudar o filtro. Atualização otimista nas mutações + refresh do summary.

### `App.js`
Composição: `SafeAreaProvider → AuthProvider → AuthGate`. Quando autenticado: `GlobalStateProvider → AppShell` (header + tabs + telas).

---

## 🧪 Fluxo de teste

1. Sobe a API ([instruções](../gestao-financeira-api/README.md)).
2. Sobe o app: `npx expo start` → `a` (emulador) ou QR Code.
3. **Login** com `demo@gestao.com` / `demo123` (criado pelo seed), ou **Cadastrar** uma conta nova.
4. Aba **Categorias** → crie "Mercado" (Despesa, cor vermelha).
5. Aba **Transações** → toque em "+ Nova transação" → "Compra do mês" R$ 350,00 (Despesa → Mercado).
6. Aba **Início** → confira filtro de mês, cards atualizados e o **gráfico de pizza** com a fatia de Mercado.
7. Na lista de **Transações**, **segure** uma linha → escolha **Editar** ou **Excluir**.
8. Tente excluir a categoria "Receita" (padrão) → bloqueado com aviso 🔒.
9. Botão **Sair** no topo → confirma → volta para tela de Login.

---

## 🩹 Troubleshooting

| Sintoma | Causa | Resolução |
| :--- | :--- | :--- |
| Barra vermelha "Network request failed" | API offline ou URL errada. | Suba a API; revise `.env`; reinicie Expo. |
| "Credenciais inválidas" no login | Senha errada ou conta inexistente. | Use `demo@gestao.com` / `demo123` ou cadastre. |
| Funciona no emulador, falha no celular | IP do `.env`. | Use IP da LAN; libere Firewall. |
| `EXPO_PUBLIC_API_URL não definida` | Falta `.env` ou prefixo. | Crie `.env` e reinicie Metro. |
| "System UI isn't responding" | RAM baixa no AVD. | AVD: RAM ≥ 2048 MB + Cold Boot Now. |
| Gráfico não aparece | Sem despesas no mês filtrado. | Cadastre uma transação de despesa no mês selecionado. |
| Long-press não dispara | Toque rápido demais. | Segure ~300ms na linha. |

---

## 🔗 Links

- 📦 [Backend (`gestao-financeira-api`)](../gestao-financeira-api/)
- 📚 [Expo](https://docs.expo.dev)
- 🧩 [React Native](https://reactnative.dev/docs/getting-started)
- 📈 [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
