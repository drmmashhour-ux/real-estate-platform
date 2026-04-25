import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { leadPricingResultsFlags } from "@/config/feature-flags";
import {
  captureLeadPricingObservation,
  evaluateLeadPricingOutcome,
  getLeadPricingResultsForAdmin,
} from "@/modules/leads/lead-pricing-results.service";
import type { LeadMonetizationConfidenceLevel } from "@/modules/leads/lead-monetization-control.types";
import type { LeadPricingExperimentMode } from "@/modules/leads/lead-pricing-experiments.types";
import type { LeadPricingModeUsed, LeadPricingOperatorAction } from "@/modules/leads/lead-pricing-results.types";

export const dynamic = "force-dynamic";

const EXPERIMENT_MODES: LeadPricingExperimentMode[] = [
  "baseline",
  "quality_weighted",
  "demand_weighted",
  "conservative",
  "aggressive",
];

function isPricingModeUsed(v: string): v is LeadPricingModeUsed {
  return (
    EXPERIMENT_MODES.includes(v as LeadPricingExperimentMode) || v === "override" || v === "baseline"
  );
}

function isConfidence(v: string): v is LeadMonetizationConfidenceLevel {
  return v === "low" || v === "medium" || v === "high";
}

function parseOperatorAction(v: unknown): LeadPricingOperatorAction | null | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v !== "string") return undefined;
  if (v === "used" || v === "ignored" || v === "overridden" || v === "cleared") return v;
  return undefined;
}

async function requireAdminPricingResults(leadId: string) {
  if (!leadPricingResultsFlags.leadPricingResultsV1) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return { error: NextResponse.json({ error: "Lead not found" }, { status: 404 }) };

  return { userId };
}

/** GET — latest observation snapshot for operators. */
export async function GET(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const gate = await requireAdminPricingResults(leadId);
  if ("error" in gate) return gate.error;

  const payload = await getLeadPricingResultsForAdmin(leadId);
  return NextResponse.json({ leadPricingResults: payload });
}

/**
 * POST — evaluate a stored observation, or capture a new advisory observation (internal audit).
 * Body: { action: "evaluate", observationId?: string } | capture fields for action "capture".
 */
export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const gate = await requireAdminPricingResults(leadId);
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action === "evaluate" ? "evaluate" : body.action === "capture" ? "capture" : null;
  if (!action) {
    return NextResponse.json({ error: 'Expected action "evaluate" or "capture"' }, { status: 400 });
  }

  if (action === "evaluate") {
    let observationId =
      typeof body.observationId === "string" && body.observationId.trim() ? body.observationId.trim() : null;
    if (!observationId) {
      const latest = await prisma.leadPricingResultObservation.findFirst({
        where: { leadId },
        orderBy: { measuredAt: "desc" },
      });
      observationId = latest?.id ?? null;
    }
    if (!observationId) {
      return NextResponse.json({ error: "No observation to evaluate for this lead." }, { status: 400 });
    }

    const summary = await evaluateLeadPricingOutcome(observationId);
    if (!summary) {
      return NextResponse.json({ error: "Observation not found." }, { status: 404 });
    }
    return NextResponse.json({ outcomeSummary: summary });
  }

  const pricingModeUsed = typeof body.pricingModeUsed === "string" ? body.pricingModeUsed.trim() : "";
  if (!isPricingModeUsed(pricingModeUsed)) {
    return NextResponse.json({ error: "Invalid pricingModeUsed" }, { status: 400 });
  }

  const displayedAdvisoryPrice = Number(body.displayedAdvisoryPrice);
  const basePrice = Number(body.basePrice);
  const confRaw = typeof body.confidenceLevel === "string" ? body.confidenceLevel.trim() : "";
  if (!isConfidence(confRaw)) {
    return NextResponse.json({ error: "confidenceLevel must be low | medium | high" }, { status: 400 });
  }
  if (!Number.isFinite(displayedAdvisoryPrice) || !Number.isFinite(basePrice)) {
    return NextResponse.json({ error: "displayedAdvisoryPrice and basePrice must be numbers" }, { status: 400 });
  }

  const observation = await captureLeadPricingObservation({
    leadId,
    pricingModeUsed,
    displayedAdvisoryPrice,
    basePrice,
    confidenceLevel: confRaw,
    operatorActionTaken: parseOperatorAction(body.operatorActionTaken),
    qualityBand: typeof body.qualityBand === "string" ? body.qualityBand : undefined,
    qualityScore: typeof body.qualityScore === "number" ? body.qualityScore : undefined,
    demandLevel: typeof body.demandLevel === "string" ? body.demandLevel : undefined,
    demandScore: typeof body.demandScore === "number" ? body.demandScore : undefined,
  });

  if (!observation) {
    return NextResponse.json({ error: "Capture unavailable (flag off or lead missing)." }, { status: 503 });
  }

  return NextResponse.json({ observation });
}
