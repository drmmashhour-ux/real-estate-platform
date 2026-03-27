/**
 * CLI entry for `prisma db seed` — do not import this from app code (use `runSeed` from seed.ts).
 */
import { prisma } from "../lib/db";
import { runSeed } from "./seed";

runSeed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
