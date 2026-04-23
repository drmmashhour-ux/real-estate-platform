import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findFirst({
    where: { name: { contains: 'Mohamed' } }
  });

  if (!user) {
    console.log('User not found. Creating user Mohamed Almashhour...');
    user = await prisma.user.create({
      data: {
        name: 'Mohamed Almashhour',
        email: 'mohamed.almashhour@example.com',
        role: 'BROKER',
        brokerStatus: 'VERIFIED',
      },
    });
  }

  const profile = await prisma.lecipmBrokerLicenceProfile.upsert({
    where: { userId: user.id },
    update: {
      fullName: 'Mohamed Almashhour',
      licenceNumber: 'J1321',
      addressLine: '207-805 boul. Chomedey',
      city: 'Laval',
      province: 'QC',
      postalCode: 'H7V 0B1',
      practiceMode: 'INDEPENDENT',
      licenceStatus: 'active',
    },
    create: {
      userId: user.id,
      fullName: 'Mohamed Almashhour',
      licenceNumber: 'J1321',
      addressLine: '207-805 boul. Chomedey',
      city: 'Laval',
      province: 'QC',
      postalCode: 'H7V 0B1',
      practiceMode: 'INDEPENDENT',
      licenceStatus: 'active',
    },
  });

  console.log('Seeded broker profile:', profile);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
