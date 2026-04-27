/**
 * Exits 0 on successful DB connect + trivial query. Never prints connection strings.
 */
import { prisma } from "../src/lib/db";

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
