import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired } from '../middlewares/auth.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '../schemas/categorySchema.js';

const router = Router();

router.use(authRequired);

// Categorias visíveis ao usuário: padrão (userId NULL) + as criadas por ele
function visibilityWhere(userId, extra = {}) {
  return {
    ...extra,
    OR: [{ userId: null }, { userId }],
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { isIncome } = req.query;
    const extra = {};
    if (isIncome === 'true') extra.isIncome = true;
    if (isIncome === 'false') extra.isIncome = false;

    const categories = await prisma.category.findMany({
      where: visibilityWhere(req.user.id, extra),
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
    const category = await prisma.category.findFirst({
      where: { id, OR: [{ userId: null }, { userId: req.user.id }] },
    });
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
      data: { ...data, isDefault: false, userId: req.user.id },
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

    if (existing.isDefault) {
      return res
        .status(403)
        .json({ error: 'Categorias padrão não podem ser editadas' });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não pode editar essa categoria' });
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
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não pode excluir essa categoria' });
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
