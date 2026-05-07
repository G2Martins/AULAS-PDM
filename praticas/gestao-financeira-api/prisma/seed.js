import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Salário',     type: 'INCOME',  color: '#16a34a', icon: 'briefcase' },
  { name: 'Freelance',   type: 'INCOME',  color: '#22c55e', icon: 'laptop' },
  { name: 'Investimentos', type: 'INCOME', color: '#10b981', icon: 'trending-up' },
  { name: 'Alimentação', type: 'EXPENSE', color: '#ef4444', icon: 'utensils' },
  { name: 'Transporte',  type: 'EXPENSE', color: '#f97316', icon: 'car' },
  { name: 'Moradia',     type: 'EXPENSE', color: '#a855f7', icon: 'home' },
  { name: 'Lazer',       type: 'EXPENSE', color: '#ec4899', icon: 'gamepad' },
  { name: 'Saúde',       type: 'EXPENSE', color: '#0ea5e9', icon: 'heart' },
  { name: 'Educação',    type: 'EXPENSE', color: '#6366f1', icon: 'book' },
  { name: 'Outros',      type: 'EXPENSE', color: '#64748b', icon: 'tag' },
];

async function main() {
  for (const c of defaultCategories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }
  console.log(`Seed: ${defaultCategories.length} categorias garantidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
