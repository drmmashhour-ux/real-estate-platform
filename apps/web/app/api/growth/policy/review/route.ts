import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";
import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyReviewDecision,
} from "@/modules/growth/policy/growth-policy-history.types";
import { addGrowthPolicyReview } from "@/modules/growth/policy/growth-policy-review.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

const DOMAINS = new Set<GrowthPolicyDomain>([
  "ads",
  "cro",
  "leads",
  "messaging",
  "content",
  "pricing",
  "broker",
  "governance",
]);

const DECISIONS = new Set<GrowthPolicyReviewDecision>([
  "acknowledged",
  "monitoring",
  "resolved",
  "recurring",
  "false_alarm",
]);

const SEVERITIES = new Set(["critical", "warning", "info"]);

export async function POST(req: Request) {
  if (!engineFlags.growthPolicyV1 || !engineFlags.growthPolicyReviewV1) {
    return NextResponse.json({ error: "Growth policy review disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const fingerprint = typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";
    const policyId = typeof body.policyId === "string" ? body.policyId.trim() : "";
    const domain = body.domain as GrowthPolicyDomain;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const severity = typeof body.severity === "string" ? body.severity.trim() : "";
    const reviewDecision = body.reviewDecision as GrowthPolicyReviewDecision;
    const note = typeof body.note === "string" ? body.note.trim() : undefined;
    const reviewedBy = typeof body.reviewedBy === "string" ? body.reviewedBy.trim() : undefined;

    if (!fingerprint || !policyId || !DOMAINS.has(domain) || !title || !SEVERITIES.has(severity) || !DECISIONS.has(reviewDecision)) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }

    const record = await addGrowthPolicyReview({
      fingerprint,
      policyId,
      domain,
      title,
      severity: severity as GrowthPolicyHistoryEntry["severity"],
      reviewedBy: reviewedBy || undefined,
      reviewDecision,
      note: note || undefined,
    });
    return NextResponse.json({ record });
  } catch (e) {
    console.error("[growth:policy-review]", e);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
