import { prisma } from "@/lib/db";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import { getListingRevenueMetrics, getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";

function defaultRange() {
  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -29);
  return { start, end: today };
}

/**
 * Records a KPI snapshot for one experiment entity (listing id or `portfolio:{hostUserId}`).
 */
export async function recordExperimentOutcome(experimentId: string, entityId: string) {
  const exp = await prisma.autonomyExperiment.findUnique({
    where: { id: experimentId },
  });

  if (!exp) {
    throw new Error("Experiment not found");
  }

  const assignment = await prisma.autonomyExperimentAssignment.findUnique({
    where: {
      experimentId_entityId: {
        experimentId,
        entityId,
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found for entity");
  }

  const range = defaultRange();

  let revenue = 0;
  let occupancy = 0;
  let bookings = 0;
  let adr = 0;
  let revpar = 0;

  if (entityId.startsWith("portfolio:")) {
    const hostUserId = entityId.slice("portfolio:".length);
    const summary = await getRevenueDashboardSummary(hostUserId);
    const p = summary.portfolio;
    revenue = Number(p.grossRevenue ?? 0);
    occupancy = Number(p.occupancyRate ?? 0);
    bookings = Number(p.bookingCount ?? 0);
    adr = Number(p.adr ?? 0);
    revpar = Number(p.revpar ?? 0);
  } else {
    const live = await getListingRevenueMetrics(entityId, range);
    if (!live) {
      revenue = 0;
      occupancy = 0;
      bookings = 0;
      adr = 0;
      revpar = 0;
    } else {
      revenue = Number(live.grossRevenue ?? 0);
      occupancy = Number(live.occupancyRate ?? 0);
      bookings = Number(live.bookingCount ?? 0);
      adr = Number(live.adr ?? 0);
      revpar = Number(live.revpar ?? 0);
    }
  }

  return prisma.autonomyExperimentOutcome.create({
    data: {
      experimentId,
      entityId,
      group: assignment.group,
      revenue,
      occupancy,
      bookings: Math.round(bookings),
      adr,
      revpar,
    },
  });
}

/** Snapshot KPIs for every assignment (latest wave — append-only rows for analysis averages). */
export async function recordAllExperimentOutcomes(experimentId: string) {
  const assignments = await prisma.autonomyExperimentAssignment.findMany({
    where: { experimentId },
    select: { entityId: true },
  });

  const rows = [];
  for (const a of assignments) {
    rows.push(await recordExperimentOutcome(experimentId, a.entityId));
  }

  return { experimentId, snapshots: rows.length };
}
