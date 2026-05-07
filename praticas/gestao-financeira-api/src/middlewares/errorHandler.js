import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: 'Registro duplicado',
      target: err.meta?.target,
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }

  if (err?.code === 'P2003') {
    return res.status(400).json({ error: 'Categoria informada não existe' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
