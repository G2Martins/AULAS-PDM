import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(60),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().max(20).optional().nullable(),
  icon: z.string().trim().max(40).optional().nullable(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
