import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import { errorHandler } from './middlewares/errorHandler.js';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n[gestao-financeira-api] Variáveis de ambiente faltando:');
  for (const key of missing) console.error(`  - ${key}`);
  console.error('\nCrie um arquivo .env na raiz do projeto (use .env.example como base):');
  console.error('  cp .env.example .env   (Linux/Mac)');
  console.error('  copy .env.example .env (Windows)\n');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'gestao-financeira-api' });
});

app.use('/auth', authRouter);
app.use('/categories', categoriesRouter);
app.use('/transactions', transactionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
