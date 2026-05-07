import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
} from '../schemas/transactionSchema.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { type, categoryId, from, to } = req.query;
    const where = {};
    if (type) where.type = String(type).toUpperCase();
    if (categoryId) where.categoryId = Number(categoryId);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(String(from));
      if (to) where.date.lte = new Date(String(to));
    }

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
    const grouped = await prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let income = 0;
    let expense = 0;
    for (const g of grouped) {
      const value = Number(g._sum.amount ?? 0);
      if (g.type === 'INCOME') income = value;
      if (g.type === 'EXPENSE') expense = value;
    }

    res.json({
      income,
      expense,
      balance: income - expense,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
    const created = await prisma.transaction.create({
      data,
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
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
