import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { flags } from "@/lib/flags";
import { ExperimentStatus, Prisma } from "@prisma/client";

const prisma = getLegacyDB();

/**
 * `Experiment.slug` for the shipped marketing hero CTA test (Order 59).
 * Default DB seed: `draft` — set `status` = `running` to expose variants when `FEATURE_RECO=1`.
 */
export const HERO_CTA_EXPERIMENT_KEY = "hero_cta_copy";

const CONVERSION_EVENT = "signup_completed";
const MIN_USERS_FOR_WINNER = 30;
const RELATIVE_LIFT = 1.2;

export type ExperimentVariantView = {
  variantKey: string;
  name: string;
  copy: string;
  variantId: string;
};

function pickVariantByWeight<T extends { id: string; weight: number }>(variants: T[]): T {
  if (variants.length === 0) throw new Error("no variants");
  const total = variants.reduce((s, v) => s + Math.max(0, v.weight), 0);
  if (total <= 0) return variants[0]!;
  let r = Math.random() * total;
  for (const v of variants) {
    r -= Math.max(0, v.weight);
    if (r <= 0) return v;
  }
  return variants[variants.length - 1]!;
}

/**
 * Uses analytics `experiments` / `Experiment.slug` (API “key” is this slug). Assignment is keyed by
 * `sessionId` = `userId` (stable, ≤128 chars) plus `userId` on the row for reporting.
 * When `flags.RECOMMENDATIONS` is off, returns `null` (use default product copy).
 */
export async function getExperimentVariant(
  userId: string | null | undefined,
  experimentKey: string
): Promise<ExperimentVariantView | null> {
  if (!flags.RECOMMENDATIONS) return null;
  if (!userId) return null;

  const exp = await prisma.experiment.findUnique({
    where: { slug: experimentKey },
    include: { variants: { orderBy: { variantKey: "asc" } } },
  });
  if (!exp || exp.status !== ExperimentStatus.running || exp.variants.length === 0) {
    return null;
  }

  const sessionId = userId;
  if (sessionId.length > 128) return null;

  const existing = await prisma.experimentAssignment.findUnique({
    where: { experimentId_sessionId: { experimentId: exp.id, sessionId } },
    include: { variant: true },
  });
  if (existing) {
    const v = existing.variant;
    return { variantKey: v.variantKey, name: v.name, copy: v.name, variantId: v.id };
  }

  const weighted = exp.variants.map((v) => ({ ...v, weight: v.weight ?? 50 }));
  const chosen = pickVariantByWeight(weighted);
  try {
    await prisma.experimentAssignment.create({
      data: {
        experimentId: exp.id,
        userId,
        sessionId,
        variantId: chosen.id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const a = await prisma.experimentAssignment.findUniqueOrThrow({
        where: { experimentId_sessionId: { experimentId: exp.id, sessionId } },
        include: { variant: true },
      });
      const v = a.variant;
      return { variantKey: v.variantKey, name: v.name, copy: v.name, variantId: v.id };
    }
    throw e;
  }

  return {
    variantKey: chosen.variantKey,
    name: chosen.name,
    copy: chosen.name,
    variantId: chosen.id,
  };
}

/**
 * Funnel event on the user’s current assignment. Uses `eventName` (e.g. `hero_view`, `cta_click`, `signup_completed`).
 */
export async function trackExperimentEvent(
  userId: string | null | undefined,
  experimentKey: string,
  event: string
): Promise<void> {
  if (!flags.RECOMMENDATIONS) return;
  if (!userId || !event) return;
  const en = event.slice(0, 64);
  if (userId.length > 128) return;

  const exp = await prisma.experiment.findUnique({ where: { slug: experimentKey }, select: { id: true, status: true } });
  if (!exp || exp.status !== ExperimentStatus.running) return;

  const a = await prisma.experimentAssignment.findUnique({
    where: { experimentId_sessionId: { experimentId: exp.id, sessionId: userId } },
    select: { variantId: true },
  });
  if (!a) return;

  await prisma.experimentEvent.create({
    data: {
      experimentId: exp.id,
      variantId: a.variantId,
      userId,
      sessionId: userId,
      eventName: en,
    },
  });
}

export type VariantResultRow = {
  variantKey: string;
  name: string;
  users: number;
  events: number;
  conversionRate: number;
};

export type ExperimentResults = {
  experimentKey: string;
  status: string;
  variants: VariantResultRow[];
  winner: { key: "A" | "B" | null; confidence: "low" | "medium" };
};

export async function getExperimentResults(experimentKey: string): Promise<ExperimentResults | null> {
  const exp = await prisma.experiment.findUnique({
    where: { slug: experimentKey },
    include: { variants: { orderBy: { variantKey: "asc" } } },
  });
  if (!exp) return null;

  const variants: VariantResultRow[] = [];
  for (const v of exp.variants) {
    const users = await prisma.experimentAssignment.count({
      where: { experimentId: exp.id, variantId: v.id },
    });
    const events = await prisma.experimentEvent.count({
      where: { experimentId: exp.id, variantId: v.id },
    });
    const converters = await prisma.experimentEvent.findMany({
      where: { experimentId: exp.id, variantId: v.id, eventName: CONVERSION_EVENT },
      distinct: ["userId"],
      select: { userId: true },
    });
    const nonNull = converters.filter((c): c is { userId: string } => c.userId != null);
    const conversionRate = users > 0 ? nonNull.length / users : 0;
    variants.push({
      variantKey: v.variantKey,
      name: v.name,
      users,
      events,
      conversionRate,
    });
  }

  return {
    experimentKey: exp.slug,
    status: exp.status,
    variants,
    winner: detectExperimentWinner(variants),
  };
}

type VariantForWinner = { variantKey: string; users: number; conversionRate: number };

export function detectExperimentWinner(variants: VariantForWinner[]): { key: "A" | "B" | null; confidence: "low" | "medium" } {
  const a = variants.find((v) => v.variantKey === "A");
  const b = variants.find((v) => v.variantKey === "B");
  if (!a || !b) {
    return { key: null, confidence: "low" };
  }

  if (a.users < MIN_USERS_FOR_WINNER && b.users < MIN_USERS_FOR_WINNER) {
    return { key: null, confidence: "low" };
  }

  const aWins =
    a.users >= MIN_USERS_FOR_WINNER && a.conversionRate > b.conversionRate * RELATIVE_LIFT && a.conversionRate > b.conversionRate;
  const bWins =
    b.users >= MIN_USERS_FOR_WINNER && b.conversionRate > a.conversionRate * RELATIVE_LIFT && b.conversionRate > a.conversionRate;

  if (aWins && !bWins) {
    return { key: "A", confidence: b.users >= MIN_USERS_FOR_WINNER ? "medium" : "low" };
  }
  if (bWins && !aWins) {
    return { key: "B", confidence: a.users >= MIN_USERS_FOR_WINNER ? "medium" : "low" };
  }
  return { key: null, confidence: "low" };
}

export async function listExperiments() {
  return prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { variantKey: "asc" } } },
  });
}
