/**
 * Demo calibration run: "Initial 50 Listing Calibration Study"
 * Run: npm run seed:calibration  (from apps/web)
 */
import { prisma } from "../lib/db";
import { addValidationItem } from "../modules/model-validation/application/addValidationItem";

const DEMO_NAME = "Initial 50 Listing Calibration Study";

async function main() {
  const existing = await prisma.modelValidationRun.findFirst({
    where: { name: DEMO_NAME },
    select: { id: true },
  });
  if (existing) {
    console.log(`[calibration] Demo run already exists: ${existing.id}`);
    return;
  }

  const run = await prisma.modelValidationRun.create({
    data: {
      name: DEMO_NAME,
      description:
        "Internal 50-listing calibration workflow — populate with engine snapshots, add human labels, then finalize.",
      status: "draft",
      createdBy: "seed:calibration",
    },
  });

  const listings = await prisma.fsboListing.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true },
  });

  let n = 0;
  for (const l of listings) {
    try {
      await addValidationItem(prisma, run.id, {
        entityType: "fsbo_listing",
        entityId: l.id,
        fillFromEngine: true,
      });
      n += 1;
    } catch (e) {
      console.warn(`[calibration] skip listing ${l.id}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`[calibration] Created run ${run.id} with ${n} items (max 50 from DB).`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
