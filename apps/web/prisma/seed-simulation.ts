/**
 * Focused simulation seed: clients, mortgage expert, properties (Property + FSBO), investor prefs,
 * investment deals, mortgage leads. Run:
 *   cd apps/web && npx tsx prisma/seed-simulation.ts
 * Or: npm run seed:simulation
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const SIM_PASSWORD = "Simulation2024!";

const IDS = {
  owner: "sim-00000001-0000-4000-8000-000000000001",
  client1: "sim-00000002-0000-4000-8000-000000000001",
  client2: "sim-00000003-0000-4000-8000-000000000001",
  broker: "sim-00000004-0000-4000-8000-000000000001",
  expert: "sim-mtg-expert-0001",
} as const;

const PROPERTY_SEED = [
  {
    title: "Laval Riverfront Condo",
    city: "Laval",
    price: 448_000,
    rent: 2650,
    type: "condo" as const,
    address: "3200 Boul. Saint-Martin Ouest, Laval",
  },
  {
    title: "Laval Duplex — Cash-flow",
    city: "Laval",
    price: 579_000,
    rent: 3800,
    type: "duplex" as const,
    address: "145 Rue Principale, Laval",
  },
  {
    title: "Montreal Plateau Condo",
    city: "Montreal",
    price: 512_000,
    rent: 2400,
    type: "condo" as const,
    address: "88 Rue Saint-Urbain, Montreal",
  },
  {
    title: "Montreal Duplex — NDG",
    city: "Montreal",
    price: 789_000,
    rent: 4200,
    type: "duplex" as const,
    address: "4100 Rue Girouard, Montreal",
  },
  {
    title: "Longueuil South Shore Condo",
    city: "Longueuil",
    price: 395_000,
    rent: 2100,
    type: "condo" as const,
    address: "900 Rue Saint-Charles, Longueuil",
  },
];

async function main() {
  const passwordHash = await hashPassword(SIM_PASSWORD);

  const owner = await prisma.user.upsert({
    where: { email: "sim-owner@lecipm.test" },
    update: { passwordHash },
    create: {
      id: IDS.owner,
      email: "sim-owner@lecipm.test",
      name: "Simulation Property Owner",
      role: "USER",
      passwordHash,
      plan: "free",
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: "client1@test.com" },
    update: { passwordHash },
    create: {
      id: IDS.client1,
      email: "client1@test.com",
      name: "Test Client One",
      role: "USER",
      passwordHash,
      plan: "free",
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: "client2@test.com" },
    update: { passwordHash },
    create: {
      id: IDS.client2,
      email: "client2@test.com",
      name: "Test Client Two",
      role: "USER",
      passwordHash,
      plan: "free",
    },
  });

  const brokerUser = await prisma.user.upsert({
    where: { email: "broker1@test.com" },
    update: { passwordHash },
    create: {
      id: IDS.broker,
      email: "broker1@test.com",
      name: "Test Mortgage Broker",
      role: "MORTGAGE_EXPERT",
      brokerStatus: "VERIFIED",
      passwordHash,
      plan: "pro",
    },
  });

  const expert = await prisma.mortgageExpert.upsert({
    where: { userId: brokerUser.id },
    update: {
      acceptedTerms: true,
      isActive: true,
      isAvailable: true,
      email: brokerUser.email!,
      name: brokerUser.name ?? "Test Mortgage Broker",
    },
    create: {
      id: IDS.expert,
      userId: brokerUser.id,
      name: brokerUser.name ?? "Test Mortgage Broker",
      email: brokerUser.email!,
      phone: "+15145550100",
      company: "LECIPM Simulation Mortgage",
      licenseNumber: "SIM-QC-001",
      title: "Mortgage Broker",
      bio: "Simulation broker for end-to-end tests.",
      acceptedTerms: true,
      isActive: true,
      isAvailable: true,
    },
  });

  await prisma.expertCredits.upsert({
    where: { expertId: expert.id },
    update: { credits: 100 },
    create: { expertId: expert.id, credits: 100 },
  });

  await prisma.investorProfile.deleteMany({
    where: { userId: { in: [client1.id, client2.id] } },
  });

  await prisma.investorProfile.create({
    data: {
      userId: client1.id,
      name: client1.name,
      email: client1.email!,
      targetCities: ["Laval"],
      propertyTypes: ["condo"],
      budgetCents: 500_000 * 100,
      strategy: "balanced",
    },
  });

  await prisma.investorProfile.create({
    data: {
      userId: client2.id,
      name: client2.name,
      email: client2.email!,
      targetCities: ["Montreal"],
      propertyTypes: ["duplex"],
      budgetCents: 800_000 * 100,
      strategy: "cash_flow",
    },
  });

  await prisma.investmentDeal.deleteMany({
    where: { userId: { in: [client1.id, client2.id] } },
  });

  const dealCommon = {
    rentalType: "LONG_TERM",
    monthlyExpenses: 2100,
    nightlyRate: null as number | null,
    occupancyRate: null as number | null,
    roiLongTerm: 7.1,
    roiShortTerm: 6.2,
    preferredStrategy: "LONG_TERM",
    riskScore: 38,
    rating: "Moderate Investment",
    marketComparison: "Market Average",
  };

  await prisma.investmentDeal.createMany({
    data: [
      {
        userId: client1.id,
        city: "Laval",
        propertyPrice: 448_000,
        monthlyRent: 2650,
        roi: 7.2,
        ...dealCommon,
      },
      {
        userId: client1.id,
        city: "Laval",
        propertyPrice: 579_000,
        monthlyRent: 3800,
        roi: 6.8,
        ...dealCommon,
      },
      {
        userId: client2.id,
        city: "Montreal",
        propertyPrice: 512_000,
        monthlyRent: 2400,
        roi: 6.5,
        ...dealCommon,
      },
      {
        userId: client2.id,
        city: "Montreal",
        propertyPrice: 789_000,
        monthlyRent: 4200,
        roi: 6.1,
        ...dealCommon,
      },
    ],
  });

  await prisma.property.deleteMany({ where: { ownerId: owner.id } });

  for (const p of PROPERTY_SEED) {
    const beds = p.type === "duplex" ? 4 : 2;
    const baths = p.type === "duplex" ? 2 : 2;
    const sqft = p.type === "duplex" ? 2100 : 950;
    await prisma.property.create({
      data: {
        ownerId: owner.id,
        city: p.city,
        address: p.address,
        price: p.price,
        beds,
        baths,
        sqft,
        propertyType: p.type === "duplex" ? "Duplex" : "Condo",
      },
    });
  }

  try {
    await prisma.fsboListing.deleteMany({ where: { ownerId: owner.id } });
    for (const p of PROPERTY_SEED) {
      const beds = p.type === "duplex" ? 4 : 2;
      const baths = p.type === "duplex" ? 2 : 2;
      const sqft = p.type === "duplex" ? 2100 : 950;
      const priceCents = p.price * 100;
      const desc = `Type: ${p.type}. Est. monthly rent: $${p.rent.toLocaleString()}. Simulation listing.`;
      await prisma.fsboListing.create({
        data: {
          ownerId: owner.id,
          title: p.title,
          description: desc,
          priceCents,
          address: p.address,
          city: p.city,
          bedrooms: beds,
          bathrooms: baths,
          surfaceSqft: sqft,
          images: [
            "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
          ],
          coverImage:
            "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
          contactEmail: owner.email!,
          status: "ACTIVE",
          moderationStatus: "APPROVED",
        },
      });
    }
  } catch (e) {
    console.warn("[seed-simulation] FSBO listings skipped (table missing or error). Run migrations, then re-run seed.", e);
  }

  await prisma.lead.deleteMany({
    where: {
      email: { in: ["client1@test.com", "client2@test.com"] },
      leadType: { equals: "mortgage" },
    },
  });

  const leadBase = {
    name: "Mortgage inquiry",
    phone: "+15145550200",
    status: "new",
    score: 72,
    leadSource: "mortgage_inquiry",
    leadType: "mortgage",
    pipelineStatus: "new",
    pipelineStage: "new",
    assignedExpertId: expert.id,
    mortgageAssignedAt: new Date(),
    message: "Simulation mortgage request — pre-approval and rate check.",
  };

  await prisma.lead.create({
    data: {
      ...leadBase,
      email: "client1@test.com",
      name: "Test Client One",
      userId: client1.id,
      mortgageInquiry: {
        city: "Laval",
        maxPurchase: 500000,
        propertyType: "condo",
        timeline: "90d",
      },
    },
  });

  await prisma.lead.create({
    data: {
      ...leadBase,
      email: "client2@test.com",
      name: "Test Client Two",
      userId: client2.id,
      mortgageInquiry: {
        city: "Montreal",
        maxPurchase: 800000,
        propertyType: "duplex",
        timeline: "120d",
      },
    },
  });

  const [userCount, propertyCount, dealCount] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.investmentDeal.count(),
  ]);
  let fsboCount = 0;
  try {
    fsboCount = await prisma.fsboListing.count();
  } catch {
    fsboCount = 0;
  }

  console.log("\n[simulation-seed] Done.");
  console.log(`  Users (total):     ${userCount}`);
  console.log(`  Property rows:     ${propertyCount}`);
  console.log(`  FSBO listings:     ${fsboCount}`);
  console.log(`  Investment deals:  ${dealCount}`);
  console.log("\n  Test logins (password for all): " + SIM_PASSWORD);
  console.log("    client1@test.com | client2@test.com | broker1@test.com");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
