import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(40)
    .regex(/^[a-z0-9-]+$/i, 'Use apenas letras, números e hífen (slug)'),
  displayName: z.string().trim().min(1, 'displayName é obrigatório').max(60),
  icon: z.string().trim().max(60).optional().nullable(),
  background: z.string().trim().max(20).optional().nullable(),
  isIncome: z.boolean().optional().default(false),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
