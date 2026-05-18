import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'income',    displayName: 'Receita',     icon: 'attach-money', background: '#16a34a', isIncome: true,  isDefault: true },
  { name: 'food',      displayName: 'Alimentação', icon: 'restaurant',   background: '#ef4444', isIncome: false, isDefault: true },
  { name: 'transport', displayName: 'Transporte',  icon: 'directions-car', background: '#f97316', isIncome: false, isDefault: true },
  { name: 'leisure',   displayName: 'Lazer',       icon: 'sports-esports', background: '#ec4899', isIncome: false, isDefault: true },
  { name: 'others',    displayName: 'Outros',      icon: 'category',     background: '#64748b', isIncome: false, isDefault: true },
];

async function main() {
  for (const c of defaultCategories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {
        displayName: c.displayName,
        icon: c.icon,
        background: c.background,
        isIncome: c.isIncome,
        isDefault: c.isDefault,
      },
      create: c,
    });
  }

  const demoEmail = 'demo@gestao.com';
  const exists = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!exists) {
    const password = await bcrypt.hash('demo123', 10);
    await prisma.user.create({
      data: { name: 'Usuário Demo', email: demoEmail, password },
    });
    console.log(`Seed: usuário demo criado (${demoEmail} / demo123).`);
  }

  console.log(`Seed: ${defaultCategories.length} categorias padrão garantidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
