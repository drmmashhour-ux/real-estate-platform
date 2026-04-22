/**
 * Default expansion checklist + progress + lightweight “AI” suggestions from live metrics.
 */
import { prisma } from "@/lib/db";

export const EXPANSION_TASK_ORDER = [
  "ONBOARD_OPERATORS",
  "ACTIVATE_DEMAND",
  "SEND_FIRST_LEADS",
  "VALIDATE_CONVERSION",
  "ACTIVATE_PRICING",
] as const;

export type ExpansionTaskType = (typeof EXPANSION_TASK_ORDER)[number];

export const PLAYBOOK_DEFAULTS = {
  onboardingFlowKey: "senior-operator-v1",
  messagingTemplateKeys: ["family-intake-v1", "operator-handoff-v1", "dm-followup-short-v1"],
};

/** Ensure one row per task type per city (idempotent). */
export async function ensureExpansionTasksForCity(cityId: string): Promise<void> {
  for (const taskType of EXPANSION_TASK_ORDER) {
    const existing = await prisma.seniorExpansionTask.findFirst({
      where: { cityId, taskType },
    });
    if (!existing) {
      await prisma.seniorExpansionTask.create({
        data: { cityId, taskType, status: "PENDING" },
      });
    }
  }
}

export function expansionProgressPct(tasks: Array<{ status: string }>): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}

/**
 * Auto-advance checklist from measurable signals (safe heuristics; ops can still override).
 */
export async function syncExpansionTasksFromMetrics(cityId: string): Promise<void> {
  const city = await prisma.seniorCity.findUnique({
    where: { id: cityId },
    include: { expansionTasks: true },
  });
  if (!city) return;

  const cityName = city.name.trim();
  const pricingCount = await prisma.seniorPricingRule.count({
    where: { city: { equals: cityName, mode: "insensitive" } },
  });

  const updates: Array<{ taskType: string; done: boolean }> = [
    { taskType: "ONBOARD_OPERATORS", done: city.operatorCount >= 10 },
    { taskType: "ACTIVATE_DEMAND", done: (city.demandScore ?? 0) >= 28 },
    { taskType: "SEND_FIRST_LEADS", done: city.leadCount >= 3 },
    {
      taskType: "VALIDATE_CONVERSION",
      done:
        city.conversionRate != null &&
        city.leadCount >= 5 &&
        (city.readinessScore ?? 0) >= 55,
    },
    { taskType: "ACTIVATE_PRICING", done: pricingCount > 0 },
  ];

  for (const u of updates) {
    if (!u.done) continue;
    await prisma.seniorExpansionTask.updateMany({
      where: { cityId, taskType: u.taskType, status: "PENDING" },
      data: { status: "DONE" },
    });
  }
}

export type ExpansionSuggestion = { cityId: string; cityName: string; message: string; severity: "info" | "warn" };

function taskOrderIndex(taskType: string): number {
  const i = EXPANSION_TASK_ORDER.indexOf(taskType as ExpansionTaskType);
  return i >= 0 ? i : 99;
}

export type ExpansionCityRow = {
  id: string;
  name: string;
  country: string;
  status: string;
  operatorCount: number;
  leadCount: number;
  conversionRate: number | null;
  demandScore: number | null;
  supplyScore: number | null;
  readinessScore: number | null;
  leadGrowthRate: number | null;
  expansionClonedFromCity: string | null;
  progressPct: number;
  nextTasks: Array<{ id: string; taskType: string; status: string }>;
  tasks: Array<{ id: string; taskType: string; status: string }>;
};

/** City list + progress + suggestions (read-only; does not recompute SQL metrics). */
export async function loadExpansionOverview(params: { country?: string }): Promise<{
  cities: ExpansionCityRow[];
  suggestions: ExpansionSuggestion[];
}> {
  const where = params.country ? { country: params.country } : {};

  let cities = await prisma.seniorCity.findMany({
    where,
    orderBy: [{ readinessScore: "desc" }, { name: "asc" }],
    include: { expansionTasks: true },
  });

  for (const c of cities) {
    await ensureExpansionTasksForCity(c.id);
    await syncExpansionTasksFromMetrics(c.id);
  }

  cities = await prisma.seniorCity.findMany({
    where,
    orderBy: [{ readinessScore: "desc" }, { name: "asc" }],
    include: { expansionTasks: true },
  });

  const suggestions = buildExpansionSuggestions(
    cities.map((c) => ({
      id: c.id,
      name: c.name,
      demandScore: c.demandScore,
      supplyScore: c.supplyScore,
      readinessScore: c.readinessScore,
      operatorCount: c.operatorCount,
      status: c.status,
    })),
  );

  const rows: ExpansionCityRow[] = cities.map((c) => {
    const tasks = [...c.expansionTasks].sort((a, b) => taskOrderIndex(a.taskType) - taskOrderIndex(b.taskType));
    const pending = tasks.filter((t) => t.status === "PENDING").sort((a, b) => taskOrderIndex(a.taskType) - taskOrderIndex(b.taskType));
    return {
      id: c.id,
      name: c.name,
      country: c.country,
      status: c.status,
      operatorCount: c.operatorCount,
      leadCount: c.leadCount,
      conversionRate: c.conversionRate,
      demandScore: c.demandScore,
      supplyScore: c.supplyScore,
      readinessScore: c.readinessScore,
      leadGrowthRate: c.leadGrowthRate,
      expansionClonedFromCity: c.expansionClonedFromCity,
      progressPct: expansionProgressPct(tasks),
      nextTasks: pending.slice(0, 3).map((t) => ({
        id: t.id,
        taskType: t.taskType,
        status: t.status,
      })),
      tasks: tasks.map((t) => ({ id: t.id, taskType: t.taskType, status: t.status })),
    };
  });

  return { cities: rows, suggestions };
}

export function buildExpansionSuggestions(
  rows: Array<{
    id: string;
    name: string;
    demandScore: number | null;
    supplyScore: number | null;
    readinessScore: number | null;
    operatorCount: number;
    status: string;
  }>,
  limit = 12,
): ExpansionSuggestion[] {
  const out: ExpansionSuggestion[] = [];
  for (const c of rows) {
    const d = c.demandScore ?? 0;
    const s = c.supplyScore ?? 0;
    const r = c.readinessScore ?? 0;

    if (d >= 55 && c.operatorCount < 8) {
      out.push({
        cityId: c.id,
        cityName: c.name,
        message: `${c.name} demand is heating up — prioritize operator onboarding (referrals + outreach).`,
        severity: "warn",
      });
    } else if (s < 35 && c.operatorCount < 10) {
      out.push({
        cityId: c.id,
        cityName: c.name,
        message: `${c.name} has low supply — recruit operators before scaling paid demand.`,
        severity: "warn",
      });
    } else if (r > 62 && c.status === "LOCKED") {
      out.push({
        cityId: c.id,
        cityName: c.name,
        message: `${c.name} is approaching readiness — run demand activation + first-lead routing.`,
        severity: "info",
      });
    } else if (d >= 40 && s >= 40 && r < 70) {
      out.push({
        cityId: c.id,
        cityName: c.name,
        message: `${c.name}: tighten conversion follow-up — readiness can cross the TESTING threshold next.`,
        severity: "info",
      });
    }
  }

  const warn = out.filter((x) => x.severity === "warn");
  const info = out.filter((x) => x.severity === "info");
  return [...warn, ...info].slice(0, limit);
}
