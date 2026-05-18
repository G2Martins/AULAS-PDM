import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired } from '../middlewares/auth.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '../schemas/categorySchema.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { isIncome } = req.query;
    const where = {};
    if (isIncome === 'true') where.isIncome = true;
    if (isIncome === 'false') where.isIncome = false;

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { displayName: 'asc' }],
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
    const created = await prisma.category.create({
      data: { ...data, isDefault: false },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = categoryUpdateSchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

    if (existing.isDefault && data.name && data.name !== existing.name) {
      return res
        .status(400)
        .json({ error: 'O slug de categorias padrão não pode ser alterado' });
    }

    const updated = await prisma.category.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

    if (existing.isDefault) {
      return res
        .status(400)
        .json({ error: 'Categorias padrão não podem ser excluídas' });
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
