import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { CapitalStrategyType } from "@/modules/capital/capital.types";
import { buildCapitalStructurePreview } from "@/modules/capital/capital-structure.engine";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";
import { dealEligibleForCapitalStack } from "@/modules/capital/capital-policy";

const TAG = "[capital-stack]";

export async function upsertCapitalStack(options: {
  pipelineDealId: string;
  actorUserId: string;
  strategyType?: CapitalStrategyType | null;
  overrides?: Partial<{
    totalCapitalRequired: number | null;
    seniorDebtTarget: number | null;
    mezzanineTarget: number | null;
    preferredEquityTarget: number | null;
    commonEquityTarget: number | null;
    notes: string | null;
    status: string;
  }>;
  useEnginePreview?: boolean;
}): Promise<{ id: string }> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: options.pipelineDealId },
    include: {
      listing: { select: { price: true } },
    },
  });
  if (!deal) throw new Error("Deal not found");

  if (!dealEligibleForCapitalStack(deal)) {
    throw new Error(
      "Capital stack setup is restricted until the deal reaches approval / conditional approval or eligible stage."
    );
  }

  const listingPrice =
    deal.listing?.price != null && Number.isFinite(deal.listing.price) ? deal.listing.price : null;

  const strategy = options.strategyType ?? "BALANCED";

  const preview =
    options.useEnginePreview !== false ?
      buildCapitalStructurePreview({
        listingPriceMajor: listingPrice,
        strategy: strategy as CapitalStrategyType,
      })
    : null;

  const merged = {
    totalCapitalRequired:
      options.overrides?.totalCapitalRequired ?? preview?.totalCapitalRequired ?? listingPrice ?? null,
    seniorDebtTarget: options.overrides?.seniorDebtTarget ?? preview?.seniorDebtTarget ?? null,
    mezzanineTarget: options.overrides?.mezzanineTarget ?? preview?.mezzanineTarget ?? null,
    preferredEquityTarget:
      options.overrides?.preferredEquityTarget ?? preview?.preferredEquityTarget ?? null,
    commonEquityTarget: options.overrides?.commonEquityTarget ?? preview?.commonEquityTarget ?? null,
    notes:
      [
        ...(preview?.warnings ?? []).map((w) => `[warning] ${w}`),
        options.overrides?.notes ?? "",
      ]
        .filter(Boolean)
        .join("\n") || null,
    assumptionsJson:
      preview ?
        ({
          rationale: preview.rationale,
          dataGaps: preview.dataGaps,
          strategyType: strategy,
        } as object)
      : ({ strategyType: strategy } as object),
  };

  const existed = await prisma.investmentPipelineCapitalStack.findUnique({
    where: { pipelineDealId: options.pipelineDealId },
    select: { id: true },
  });

  const row = await prisma.investmentPipelineCapitalStack.upsert({
    where: { pipelineDealId: options.pipelineDealId },
    create: {
      pipelineDealId: options.pipelineDealId,
      strategyType: strategy as string,
      status: options.overrides?.status ?? "ACTIVE",
      totalCapitalRequired: merged.totalCapitalRequired,
      seniorDebtTarget: merged.seniorDebtTarget,
      mezzanineTarget: merged.mezzanineTarget,
      preferredEquityTarget: merged.preferredEquityTarget,
      commonEquityTarget: merged.commonEquityTarget,
      assumptionsJson: merged.assumptionsJson,
      notes: merged.notes,
    },
    update: {
      strategyType: strategy as string,
      status: options.overrides?.status ?? undefined,
      totalCapitalRequired: merged.totalCapitalRequired,
      seniorDebtTarget: merged.seniorDebtTarget,
      mezzanineTarget: merged.mezzanineTarget,
      preferredEquityTarget: merged.preferredEquityTarget,
      commonEquityTarget: merged.commonEquityTarget,
      assumptionsJson: merged.assumptionsJson,
      notes: merged.notes ?? undefined,
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: existed ? "STACK_UPDATED" : "STACK_CREATED",
    note: "Capital stack upsert",
    metadataJson: { strategyType: strategy },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId });
  return row;
}

export async function getCapitalStack(pipelineDealId: string) {
  return prisma.investmentPipelineCapitalStack.findUnique({
    where: { pipelineDealId },
  });
}
