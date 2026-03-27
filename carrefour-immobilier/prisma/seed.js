const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Fixed UUIDs for local testing (optional; see docs). */
const SELLER_ID = "11111111-1111-1111-1111-111111111111";
const BUYER_ID = "22222222-2222-2222-2222-222222222222";

const DEMO_PASSWORD = "CarrefourDemo2025!";

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: "seller@carrefour.local" },
    update: { password: hash },
    create: {
      id: SELLER_ID,
      email: "seller@carrefour.local",
      password: hash,
      role: "SELLER",
    },
  });
  await prisma.user.upsert({
    where: { email: "buyer@carrefour.local" },
    update: { password: hash },
    create: {
      id: BUYER_ID,
      email: "buyer@carrefour.local",
      password: hash,
      role: "BUYER",
    },
  });
  console.log("Seed OK — seller:", SELLER_ID, "buyer:", BUYER_ID);
  console.log("Demo login password for both:", DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
