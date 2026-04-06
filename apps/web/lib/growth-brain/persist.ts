import { createHash } from "node:crypto";
import type { GrowthBrainDomain, GrowthBrainPriority, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { BrainRecommendationDraft } from "./opportunity-detector";
import { applyAutomationPolicy } from "./rules";
import type { GrowthActionRecommendation, GrowthAutomationMode } from "./types";

export function fingerprintFor(draft: BrainRecommendationDraft): string {
  const raw = [
    draft.type,
    draft.domain,
    draft.title,
    draft.targetEntityType ?? "",
    draft.targetEntityId ?? "",
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

export async function persistRecommendations(
  prisma: PrismaClient,
  runId: string,
  drafts: BrainRecommendationDraft[],
  mode: GrowthAutomationMode
): Promise<{ created: number; superseded: number }> {
  const superseded = await prisma.growthBrainRecommendation.updateMany({
    where: { status: "active" },
    data: { status: "superseded" },
  });

  let created = 0;
  for (const d of drafts) {
    const fp = fingerprintFor(d);
    const policy = applyAutomationPolicy(
      {
        type: d.type,
        domain: d.domain,
        priority: d.priority,
        confidence: d.confidence,
        title: d.title,
        description: d.description,
        reasoning: d.reasoning,
        suggestedAction: d.suggestedAction,
        autoRunnable: d.autoRunnable,
        requiresApproval: d.requiresApproval,
        targetEntityType: d.targetEntityType,
        targetEntityId: d.targetEntityId,
        metadataJson: d.metadataJson ?? null,
      } satisfies Omit<GrowthActionRecommendation, "id" | "createdAt">,
      mode
    );

    await prisma.growthBrainRecommendation.upsert({
      where: { fingerprint: fp },
      create: {
        fingerprint: fp,
        type: policy.type,
        domain: policy.domain as GrowthBrainDomain,
        priority: policy.priority as GrowthBrainPriority,
        confidence: policy.confidence,
        title: policy.title,
        description: policy.description,
        reasoning: policy.reasoning,
        suggestedAction: policy.suggestedAction,
        autoRunnable: policy.autoRunnable,
        requiresApproval: policy.requiresApproval,
        targetEntityType: policy.targetEntityType,
        targetEntityId: policy.targetEntityId,
        metadataJson: (policy.metadataJson ?? undefined) as Prisma.InputJsonValue | undefined,
        runId,
        status: "active",
      },
      update: {
        type: policy.type,
        domain: policy.domain as GrowthBrainDomain,
        priority: policy.priority as GrowthBrainPriority,
        confidence: policy.confidence,
        title: policy.title,
        description: policy.description,
        reasoning: policy.reasoning,
        suggestedAction: policy.suggestedAction,
        autoRunnable: policy.autoRunnable,
        requiresApproval: policy.requiresApproval,
        targetEntityType: policy.targetEntityType,
        targetEntityId: policy.targetEntityId,
        metadataJson: (policy.metadataJson ?? undefined) as Prisma.InputJsonValue | undefined,
        runId,
        status: "active",
      },
    });
    created += 1;
  }

  return { created, superseded: superseded.count };
}
