import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("Testing DB connection...");
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("DB Result:", result);
    process.exit(0);
  } catch (e) {
    console.error("DB Error:", e);
    process.exit(1);
  }
}

main();
