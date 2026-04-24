import { prisma } from "../lib/db";

async function seed() {
  console.log("Seeding AI Agents...");

  const agents = [
    { name: "Pricing Opti V4", domain: "pricing", performanceScore: 0.82 },
    { name: "Dynamic Nudger Alpha", domain: "pricing", performanceScore: 0.75 },
    { name: "Ranking Engine X", domain: "ranking", performanceScore: 0.68 },
    { name: "Growth Ally", domain: "messaging", performanceScore: 0.55 },
  ];

  for (const a of agents) {
    // @ts-ignore
    await prisma.aiAgent.upsert({
      where: { id: `seed-${a.name.toLowerCase().replace(/\s/g, "-")}` },
      create: {
        id: `seed-${a.name.toLowerCase().replace(/\s/g, "-")}`,
        name: a.name,
        domain: a.domain,
        performanceScore: a.performanceScore,
        status: "ACTIVE",
      },
      update: {
        performanceScore: a.performanceScore,
      },
    });
  }

  console.log("Seeding complete.");
}

seed().catch(console.error);
