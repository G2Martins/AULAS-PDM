import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '../schemas/categorySchema.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = type ? { type: String(type).toUpperCase() } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = categoryCreateSchema.parse(req.body);
    const created = await prisma.category.create({ data });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = categoryUpdateSchema.parse(req.body);
    const updated = await prisma.category.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
