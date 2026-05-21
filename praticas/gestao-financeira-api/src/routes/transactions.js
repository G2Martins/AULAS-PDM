import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired } from '../middlewares/auth.js';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
} from '../schemas/transactionSchema.js';

const router = Router();

router.use(authRequired);

function buildDateRange({ month, year, from, to }) {
  if (month && year) {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isFinite(m) || !Number.isFinite(y) || m < 1 || m > 12) return null;
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);
    return { gte: start, lt: end };
  }
  if (from || to) {
    const range = {};
    if (from) range.gte = new Date(String(from));
    if (to) range.lte = new Date(String(to));
    return range;
  }
  return null;
}

// Garante que a categoria informada é visível ao usuário (padrão ou própria).
async function assertCategoryVisible(categoryId, userId) {
  if (!categoryId) return;
  const cat = await prisma.category.findFirst({
    where: { id: Number(categoryId), OR: [{ userId: null }, { userId }] },
  });
  if (!cat) {
    const err = new Error('Categoria informada não existe');
    err.status = 400;
    throw err;
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { categoryId, isIncome, month, year, from, to } = req.query;
    const where = { userId: req.user.id };

    if (categoryId) where.categoryId = Number(categoryId);
    if (isIncome === 'true' || isIncome === 'false') {
      where.category = { isIncome: isIncome === 'true' };
    }
    const range = buildDateRange({ month, year, from, to });
    if (range) where.date = range;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const { month, year, from, to } = req.query;
    const where = { userId: req.user.id };
    const range = buildDateRange({ month, year, from, to });
    if (range) where.date = range;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    let income = 0;
    let expense = 0;
    const byCategory = new Map();

    for (const t of transactions) {
      const v = Number(t.value);
      const isInc = t.category.isIncome;
      if (isInc) income += v;
      else expense += v;

      const key = t.category.id;
      const acc = byCategory.get(key) || {
        categoryId: key,
        name: t.category.name,
        displayName: t.category.displayName,
        background: t.category.background,
        isIncome: isInc,
        total: 0,
      };
      acc.total += v;
      byCategory.set(key, acc);
    }

    res.json({
      income,
      expense,
      balance: income - expense,
      byCategory: Array.from(byCategory.values()),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id },
      include: { category: true },
    });
    if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = transactionCreateSchema.parse(req.body);
    await assertCategoryVisible(data.categoryId, req.user.id);
    const created = await prisma.transaction.create({
      data: { ...data, userId: req.user.id },
      include: { category: true },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = transactionUpdateSchema.parse(req.body);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não pode editar essa transação' });
    }
    if (data.categoryId) {
      await assertCategoryVisible(data.categoryId, req.user.id);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não pode excluir essa transação' });
    }

    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
