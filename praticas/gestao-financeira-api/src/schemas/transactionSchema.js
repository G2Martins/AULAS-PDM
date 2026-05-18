import { z } from 'zod';

export const transactionCreateSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(120),
  value: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  categoryId: z.coerce.number().int().positive(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();
