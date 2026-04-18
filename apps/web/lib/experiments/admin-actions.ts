"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { parseTrafficSplitJson } from "@/lib/experiments/validators";
import { routing } from "@/i18n/routing";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";

function revalidateExperimentsPages(id?: string) {
  const base = `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}`;
  revalidatePath(`${base}/admin/experiments`);
  if (id) revalidatePath(`${base}/admin/experiments/${id}`);
}

async function guard() {
  await requireAdminControlUserId();
}

export async function startExperimentAction(id: string) {
  await guard();
  const now = new Date();
  await prisma.experiment.update({
    where: { id },
    data: { status: "running", startAt: now, endAt: null },
  });
  revalidateExperimentsPages(id);
}

export async function pauseExperimentAction(id: string) {
  await guard();
  await prisma.experiment.update({
    where: { id },
    data: { status: "paused" },
  });
  revalidateExperimentsPages(id);
}

export async function completeExperimentAction(id: string) {
  await guard();
  await prisma.experiment.update({
    where: { id },
    data: { status: "completed", endAt: new Date() },
  });
  revalidateExperimentsPages(id);
}

export async function archiveExperimentAction(id: string) {
  await guard();
  await prisma.experiment.update({
    where: { id },
    data: { archivedAt: new Date(), status: "archived" },
  });
  revalidateExperimentsPages(id);
}

export async function setWinnerVariantAction(id: string, winnerVariantKey: string) {
  await guard();
  await prisma.experiment.update({
    where: { id },
    data: { winnerVariantKey },
  });
  revalidateExperimentsPages(id);
}

export async function stopVariantAction(id: string, variantKey: string) {
  await guard();
  const exp = await prisma.experiment.findUnique({ where: { id }, select: { stoppedVariantKeys: true } });
  if (!exp) return;
  const cur = Array.isArray(exp.stoppedVariantKeys)
    ? (exp.stoppedVariantKeys as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  if (!cur.includes(variantKey)) cur.push(variantKey);
  await prisma.experiment.update({
    where: { id },
    data: { stoppedVariantKeys: cur },
  });
  revalidateExperimentsPages(id);
}

export async function createDraftExperimentAction(input: {
  name: string;
  slug: string;
  targetSurface: string;
  primaryMetric: string;
  hypothesis?: string;
  trafficSplitJson: unknown;
  variants: { variantKey: string; name: string; configJson: unknown }[];
}) {
  await guard();
  parseTrafficSplitJson(input.trafficSplitJson);
  const exp = await prisma.experiment.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      targetSurface: input.targetSurface.trim(),
      primaryMetric: input.primaryMetric.trim(),
      hypothesis: input.hypothesis?.trim() || null,
      status: "draft",
      trafficSplitJson: input.trafficSplitJson as object,
      variants: {
        create: input.variants.map((v) => ({
          variantKey: v.variantKey,
          name: v.name,
          configJson: v.configJson as object,
        })),
      },
    },
  });
  revalidateExperimentsPages();
  return exp.id;
}

export async function createDraftExperimentFromFormAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const targetSurface = String(formData.get("targetSurface") ?? "").trim();
  const primaryMetric = String(formData.get("primaryMetric") ?? "").trim() || "page_view";
  const hypothesis = String(formData.get("hypothesis") ?? "").trim();
  const v1k = String(formData.get("v1k") ?? "control").trim() || "control";
  const v2k = String(formData.get("v2k") ?? "b").trim() || "b";
  await createDraftExperimentAction({
    name,
    slug,
    targetSurface,
    primaryMetric,
    hypothesis: hypothesis || undefined,
    trafficSplitJson: { [v1k]: 0.5, [v2k]: 0.5 },
    variants: [
      { variantKey: v1k, name: "Control", configJson: {} },
      { variantKey: v2k, name: "Variant B", configJson: {} },
    ],
  });
}
