/**
 * Optional demo seed for Growth Brain dashboards — run when DATABASE_URL is set:
 * `pnpm exec tsx scripts/seed-growth-brain-demo.ts`
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const seeds = [
      {
        role: "owner" as const,
        name: "Demo Owner",
        email: "demo.owner.growth@example.com",
        city: "Montreal",
        category: "Condo",
        source: "manual" as const,
        permissionStatus: "granted" as const,
        stage: "awaiting_assets" as const,
        intent: "list",
      },
      {
        role: "buyer" as const,
        name: "Demo Buyer",
        email: "demo.buyer.growth@example.com",
        city: "Laval",
        source: "form" as const,
        permissionStatus: "granted" as const,
        stage: "new" as const,
        intent: "buy",
        needsFollowUp: true,
        followUpReason: "Demo stale flag",
      },
    ];

    for (const row of seeds) {
      const exists = await prisma.growthEngineLead.findFirst({
        where: { email: row.email },
      });
      if (!exists) {
        await prisma.growthEngineLead.create({ data: row });
      }
    }
    console.log("Demo growth leads ensured.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
