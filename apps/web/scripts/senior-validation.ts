/**
 * Senior Living Hub validation — residences, matching, leads.
 *
 *   pnpm exec tsx scripts/senior-validation.ts
 *
 * Requires DATABASE_URL and ideally a HOST/BROKER user id for operator (optional).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createResidence,
  getResidence,
  updateResidence,
  listResidences,
} from "@/modules/senior-living/residence.service";
import { syncResidenceServices } from "@/modules/senior-living/service.service";
import { upsertUnits } from "@/modules/senior-living/unit.service";
import { createMatchProfile, matchResidences } from "@/modules/senior-living/matching.service";
import { createSeniorLead } from "@/modules/senior-living/lead.service";
import { verifyResidence } from "@/modules/senior-living/verification.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Senior Living Hub validation ==========\n");
  let failed = 0;

  let operatorId: string | null =
    process.env.SENIOR_VALIDATION_OPERATOR_USER_ID?.trim() || null;
  if (!operatorId) {
    const op = await prisma.user.findFirst({
      where: { role: PlatformRole.HOST },
      select: { id: true },
    });
    operatorId = op?.id ?? null;
  }

  try {
    const res = await createResidence({
      name: `Validation Residence ${Date.now()}`,
      description: "Smoke test residence for automated validation.",
      address: "123 Validation Ave",
      city: "Montreal",
      province: "QC",
      operatorId,
      careLevel: "ASSISTED",
      has24hStaff: true,
      medicalSupport: true,
      mealsIncluded: true,
      activitiesIncluded: true,
      basePrice: 4500,
      priceRangeMin: 4000,
      priceRangeMax: 7000,
    });

    await upsertUnits(res.id, [
      { type: "STUDIO", price: 4200, available: true },
      { type: "1BR", price: 5100, available: true },
    ]);

    await syncResidenceServices(res.id, [
      { name: "Physiotherapy", category: "MEDICAL" },
      { name: "Memory care programming", category: "WELLNESS" },
      { name: "Housekeeping", category: "DAILY_LIFE" },
    ]);

    await verifyResidence(res.id, true);
    console.log(`PASS create residence ${res.id}`);

    await updateResidence(res.id, { verified: true, rating: 4.7 });
    const loaded = await getResidence(res.id);
    if (!loaded?.verified) failed++;
    console.log("PASS load residence + verification flag");

    const filtered = await listResidences({
      city: "Montreal",
      careLevel: "ASSISTED",
      verifiedOnly: true,
    });
    if (!filtered.some((r) => r.id === res.id)) failed++;
    console.log("PASS list residences filter");

    const profile = await createMatchProfile({
      name: "Family member",
      mobilityLevel: "LIMITED",
      medicalNeeds: "LIGHT",
      budget: 5000,
      preferredCity: "Montreal",
    });

    const { matches } = await matchResidences(profile.id);
    if (!matches.some((m) => m.residenceId === res.id && m.score > 0)) failed++;
    console.log(`PASS matching (${matches.length} scored)`);

    const lead = await createSeniorLead({
      residenceId: res.id,
      requesterName: "Validation Family",
      email: `senior-valid-${Date.now()}@example.test`,
      needsLevel: "MEDIUM",
      budget: 5000,
    });

    const stored = await prisma.seniorLead.findUnique({ where: { id: lead.id } });
    if (!stored || stored.status !== "NEW") failed++;
    console.log("PASS senior lead stored");

    await prisma.seniorLead.deleteMany({ where: { residenceId: res.id } });
    await prisma.seniorMatchProfile.deleteMany({ where: { id: profile.id } });
    await prisma.seniorResidence.delete({ where: { id: res.id } });

    console.log("PASS cleanup");
  } catch (e) {
    console.log(`FAIL ${e instanceof Error ? e.message : e}`);
    failed++;
  }

  console.log(failed ? `\n❌ Done with ${failed} failure(s)\n` : "\n✅ Senior validation passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
