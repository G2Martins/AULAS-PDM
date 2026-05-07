# 📱 gestao-financeira (App)

Aplicativo mobile do projeto **Gestão Financeira** — front-end em React Native (Expo) que consome a API [`gestao-financeira-api/`](../gestao-financeira-api/) para registrar receitas, despesas e categorias do usuário.

Stack: **Expo + React Native + Context API + fetch**.

---

## ✨ Funcionalidades

- 📊 **Início (Dashboard):** cards de Receitas, Despesas e Saldo + lista das movimentações recentes (com pull-to-refresh).
- 💸 **Transações:** cadastra, lista e remove transações (com seleção dinâmica da categoria por tipo).
- 🏷️ **Categorias:** cadastra, lista e remove categorias (Receita ou Despesa).
- 🔄 Estado global compartilhado via **Context API** — qualquer alteração reflete instantaneamente em todas as telas.
- 🌐 Conexão configurável por `.env` (suporta emulador e celular físico).

---

## 🧰 Pré-requisitos

- **Node.js 18+**
- **API rodando** em `http://localhost:3000` ([`gestao-financeira-api`](../gestao-financeira-api/))
- Uma das opções abaixo para testar o app:
  - **Emulador Android** via Android Studio (AVD)
  - **Expo Go** instalado no celular físico (mesmo Wi-Fi do PC)

---

## 🚀 Setup do zero

```bash
# 1. Instalar dependências
npm install

# 2. Criar .env (ver seção abaixo)

# 3. Subir Metro Bundler
npx expo start
```

No terminal do Expo:
- Pressione **`a`** para abrir no emulador Android.
- Ou escaneie o QR Code com o app **Expo Go** no celular.

> ⚠️ A API precisa estar rodando **antes** de abrir o app — caso contrário aparecerá uma barra vermelha com erro de rede.

---

## 🌐 Variáveis de ambiente (`.env`)

Crie `.env` na raiz do app. A variável **deve começar com `EXPO_PUBLIC_`** para ser exposta ao bundle JS.

### 📱 Emulador Android (Android Studio)
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
> `10.0.2.2` é o alias que o emulador usa pra acessar o `localhost` do PC.

### 📲 Celular físico (Expo Go)
```
EXPO_PUBLIC_API_URL=http://192.168.0.47:3000
```
- Descubra seu IP local com `ipconfig` (Windows) → `Endereço IPv4`.
- PC e celular precisam estar no **mesmo Wi-Fi**.
- No primeiro acesso, libere o **Node.js no Firewall do Windows** (rede privada).

> 🔁 Sempre que mudar o `.env`, **pare e reinicie** o `npx expo start` (variáveis são lidas no boot).

---

## 📜 Scripts (`package.json`)

| Script | O que faz |
| :--- | :--- |
| `npm start` / `npx expo start` | Sobe o Metro Bundler. |
| `npm run android` | Sobe Metro e abre direto no emulador/dispositivo Android. |
| `npm run ios` | (Apenas macOS) Abre no simulador iOS. |
| `npm run web` | Abre versão web (Expo Web). |

---

## 🗂️ Estrutura

```
gestao-financeira/
├── 📁 assets/                     # Ícones e splash do Expo
├── 📁 src
│   ├── 📁 components
│   │   └── 📄 TabBar.jsx          # Barra de abas customizada
│   ├── 📁 contexts
│   │   └── 📄 GlobalState.jsx     # Provider + useGlobalState()
│   ├── 📁 screens
│   │   ├── 📄 DashboardScreen.jsx
│   │   ├── 📄 TransactionsScreen.jsx
│   │   └── 📄 CategoriesScreen.jsx
│   └── 📁 services
│       └── 📄 api.js              # Cliente HTTP (fetch wrapper)
├── 📄 App.js                      # Provider raiz + tabs
├── 📄 index.js                    # Entry-point Expo
├── ⚙️ .env                        # EXPO_PUBLIC_API_URL (não commitar)
├── ⚙️ .env.example
├── ⚙️ app.json                    # Config do Expo
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ package-lock.json
└── ⚙️ package.json
```

---

## 🧠 Arquitetura

### `services/api.js`
Wrapper em volta do `fetch` que centraliza:
- URL base (`EXPO_PUBLIC_API_URL`)
- Headers JSON
- Serialização de body
- Conversão de query string nas listagens
- Tratamento de erro padronizado (lança `Error` com a mensagem do backend)

Expõe um objeto `api` com os métodos:
```
listCategories(type?), createCategory(payload), updateCategory(id, payload), deleteCategory(id)
listTransactions(filters?), getSummary(), createTransaction(payload),
  updateTransaction(id, payload), deleteTransaction(id)
```

### `contexts/GlobalState.jsx`
Context API que mantém:
- `categories`, `transactions`, `summary` (estado em memória)
- `loading`, `error` (UI)
- Helpers: `addCategory`, `removeCategory`, `addTransaction`, `removeTransaction`, `refreshAll`

Atualiza otimisticamente a lista local **e** dispara refresh do `summary` após mutações em transações para manter o saldo consistente.

Hook de uso:
```js
import { useGlobalState } from './src/contexts/GlobalState';

const { categories, addCategory } = useGlobalState();
```

### `App.js`
Composição: `SafeAreaProvider` → `GlobalStateProvider` → `AppShell` (header + telas + `TabBar`).

---

## 🧪 Como testar o fluxo

1. Sobe a API ([instruções](../gestao-financeira-api/README.md)) — confirma `Seed: 10 categorias garantidas.`
2. Sobe o app: `npx expo start` → `a` (emulador) ou QR Code.
3. Aba **Categorias** → crie "Mercado" como **Despesa**.
4. Aba **Transações** → adicione "Compra do mês" R$ 350,00 (Despesa → categoria Mercado).
5. Aba **Início** → conferir que `Despesas` e `Saldo` atualizaram + a transação aparece em "Movimentações recentes".
6. Pull-to-refresh na lista do Início → recarrega tudo da API.

---

## 🩹 Troubleshooting

| Sintoma | Causa provável | Como resolver |
| :--- | :--- | :--- |
| Barra vermelha "API: Network request failed" | API offline ou `EXPO_PUBLIC_API_URL` errada. | Sobe a API; revisa `.env`; reinicia `expo start`. |
| Funciona no emulador, mas não no celular | IP errado no `.env` ou Firewall bloqueando. | Use IP da LAN do PC (`ipconfig`); libera Node.js no Firewall (rede privada). |
| `EXPO_PUBLIC_API_URL não definida` no console | `.env` ausente ou variável sem prefixo `EXPO_PUBLIC_`. | Cria `.env` com a chave correta e reinicia o Metro. |
| "System UI isn't responding" no emulador | Pouca RAM/CPU no AVD. | Device Manager → editar AVD → RAM ≥ 2048 MB; Cold Boot Now. |
| Categoria não aparece ao criar transação | Tipo do toggle (Receita/Despesa) não casa com o tipo da categoria. | Crie pelo menos uma categoria do tipo desejado. |

---

## 🔗 Links

- 📦 [Backend (`gestao-financeira-api`)](../gestao-financeira-api/)
- 📚 [Documentação do Expo](https://docs.expo.dev)
- 🧩 [React Native](https://reactnative.dev/docs/getting-started)
