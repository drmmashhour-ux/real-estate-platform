import { prisma } from "@/lib/db";

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Aggregates outcome rows into a result snapshot (mean KPIs per arm). Not a frequentist significance test —
 * deterministic summary for ops + learning hooks.
 */
export async function computeExperimentResults(experimentId: string) {
  const rows = await prisma.autonomyExperimentOutcome.findMany({
    where: { experimentId },
  });

  const treatment = rows.filter((r) => r.group === "treatment");
  const control = rows.filter((r) => r.group === "control");

  const treatmentRevenue = avg(treatment.map((x) => x.revenue));
  const controlRevenue = avg(control.map((x) => x.revenue));
  const upliftRevenue = treatmentRevenue - controlRevenue;

  const treatmentBookings = avg(treatment.map((x) => x.bookings));
  const controlBookings = avg(control.map((x) => x.bookings));
  const upliftBookings = treatmentBookings - controlBookings;

  const sampleSize = rows.length;
  const confidenceScore = Math.min(1, sampleSize / 100);

  return prisma.autonomyExperimentResult.create({
    data: {
      experimentId,
      treatmentRevenue,
      controlRevenue,
      upliftRevenue,
      treatmentBookings,
      controlBookings,
      upliftBookings,
      confidenceScore,
      sampleSize,
    },
  });
}
