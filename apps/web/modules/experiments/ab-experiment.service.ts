import { randomBytes } from "node:crypto";
import type { Experiment, ExperimentStatus, ExperimentVariant, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseTrafficSplitJson } from "@/lib/experiments/validators";
import type { ExperimentDomain, AbExperimentView, AbVariantView, VariantOutcomeStatus } from "./ab-testing.types";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "exp"}-${randomBytes(3).toString("hex")}`;
}

function mapStatus(s: ExperimentStatus): AbExperimentView["status"] {
  return s as AbExperimentView["status"];
}

function toExperimentView(row: Experiment): AbExperimentView {
  const sec = row.metricSecondary;
  return {
    id: row.id,
    name: row.name,
    domain: (row.targetSurface as ExperimentDomain) || "landing",
    objective: row.objective ?? row.hypothesis ?? null,
    metricPrimary: row.primaryMetric,
    metricSecondary: Array.isArray(sec) ? sec : sec ? [sec] : [],
    status: mapStatus(row.status),
    audienceScope: row.audienceScope ?? {},
    startedAt: row.startAt?.toISOString() ?? null,
    endedAt: row.endAt?.toISOString() ?? null,
    notes: row.notes ?? null,
    slug: row.slug,
    targetSurface: row.targetSurface,
  };
}

function toVariantView(v: ExperimentVariant, metrics?: Partial<AbVariantView>): AbVariantView {
  const st = (v.outcomeStatus as VariantOutcomeStatus | null) ?? "active";
  return {
    id: v.id,
    experimentId: v.experimentId,
    key: v.variantKey,
    label: v.name,
    payload: v.configJson,
    status: st,
    impressions: metrics?.impressions ?? 0,
    clicks: metrics?.clicks ?? 0,
    leads: metrics?.leads ?? 0,
    bookings: metrics?.bookings ?? 0,
    revenue: metrics?.revenue ?? 0,
    ctr: metrics?.ctr ?? null,
    cvr: metrics?.cvr ?? null,
    notes: null,
  };
}

export type CreateExperimentInput = {
  name: string;
  domain: ExperimentDomain;
  objective: string;
  metricPrimary: string;
  metricSecondary?: unknown[];
  audienceScope?: unknown;
  notes?: unknown;
  trafficSplitJson: Record<string, number>;
  variants: { key: string; label: string; payload: unknown }[];
  slug?: string;
};

export async function createExperiment(input: CreateExperimentInput): Promise<AbExperimentView> {
  parseTrafficSplitJson(input.trafficSplitJson);
  const slug = input.slug?.trim() || slugify(input.name);
  const row = await prisma.experiment.create({
    data: {
      name: input.name.trim(),
      slug,
      targetSurface: input.domain,
      hypothesis: input.objective.trim(),
      objective: input.objective.trim(),
      primaryMetric: input.metricPrimary.trim(),
      metricSecondary: (input.metricSecondary ?? []) as Prisma.InputJsonValue,
      audienceScope: input.audienceScope ?? {},
      notes: input.notes ?? undefined,
      status: "draft",
      trafficSplitJson: input.trafficSplitJson,
      variants: {
        create: input.variants.map((v) => ({
          variantKey: v.key,
          name: v.label,
          configJson: v.payload as object,
        })),
      },
    },
  });
  return toExperimentView(row);
}

export type CreateVariantInput = {
  experimentId: string;
  key: string;
  label: string;
  payload: unknown;
};

export async function createVariant(input: CreateVariantInput): Promise<AbVariantView> {
  const v = await prisma.experimentVariant.create({
    data: {
      experimentId: input.experimentId,
      variantKey: input.key,
      name: input.label,
      configJson: input.payload as object,
    },
  });
  return toVariantView(v);
}

export async function listExperiments(filters?: {
  status?: ExperimentStatus | ExperimentStatus[];
  domain?: ExperimentDomain;
}): Promise<AbExperimentView[]> {
  const status = filters?.status;
  const rows = await prisma.experiment.findMany({
    where: {
      ...(Array.isArray(status) ? { status: { in: status } } : status ? { status } : {}),
      ...(filters?.domain ? { targetSurface: filters.domain } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toExperimentView);
}

export async function getExperimentById(id: string): Promise<{
  experiment: AbExperimentView;
  variants: AbVariantView[];
} | null> {
  const row = await prisma.experiment.findUnique({
    where: { id },
    include: { variants: { orderBy: { variantKey: "asc" } } },
  });
  if (!row) return null;
  return {
    experiment: toExperimentView(row),
    variants: row.variants.map((v) => toVariantView(v)),
  };
}

export async function pauseExperiment(id: string): Promise<void> {
  await prisma.experiment.update({
    where: { id },
    data: { status: "paused" },
  });
}

export async function completeExperiment(id: string): Promise<void> {
  await prisma.experiment.update({
    where: { id },
    data: { status: "completed", endAt: new Date() },
  });
}

export { toVariantView, toExperimentView };
