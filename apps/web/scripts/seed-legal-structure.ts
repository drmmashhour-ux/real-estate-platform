import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Mohamed' } }
  });

  if (!user) {
    throw new Error('User Mohamed Almashhour not found. Please seed user first.');
  }

  // 1. Create Legal Entities (Phase 2)
  const brokerage = await prisma.lecipmLegalEntity.upsert({
    where: { id: 'lecipm_brokerage' },
    update: {},
    create: {
      id: 'lecipm_brokerage',
      name: '9375-7649 Québec Inc.',
      type: 'BROKERAGE',
      jurisdiction: 'QC',
      registrationNumber: '1175764917', // Example NEQ
      regulator: 'OACIQ',
    }
  });

  const tech = await prisma.lecipmLegalEntity.upsert({
    where: { id: 'lecipm_tech' },
    update: {},
    create: {
      id: 'lecipm_tech',
      name: 'LECIPM Technologies Inc.',
      type: 'TECH',
      jurisdiction: 'QC',
      regulator: null,
    }
  });

  const fund = await prisma.lecipmLegalEntity.upsert({
    where: { id: 'lecipm_fund' },
    update: {},
    create: {
      id: 'lecipm_fund',
      name: 'LECIPM Capital Inc.',
      type: 'FUND',
      jurisdiction: 'QC',
      regulator: 'AMF',
    }
  });

  // 2. Assign User to Entities (Phase 3)
  await prisma.lecipmUserEntityRole.upsert({
    where: { userId_entityId_role: { userId: user.id, entityId: brokerage.id, role: 'BROKER' } },
    update: {},
    create: { userId: user.id, entityId: brokerage.id, role: 'BROKER' }
  });

  await prisma.lecipmUserEntityRole.upsert({
    where: { userId_entityId_role: { userId: user.id, entityId: brokerage.id, role: 'DIRECTOR' } },
    update: {},
    create: { userId: user.id, entityId: brokerage.id, role: 'DIRECTOR' }
  });

  console.log('Seeded Legal Entities and Roles.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
