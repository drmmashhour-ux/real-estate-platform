import { randomUUID } from "crypto";
import type { AutonomousActionCandidate, BuildCandidatesInput } from "@/modules/autonomy/autonomy.types";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";

function id(): string {
  return randomUUID();
}

function baseCandidate(p: Partial<AutonomousActionCandidate> & Pick<AutonomousActionCandidate, "actionType" | "domain" | "riskLevel" | "rationale" | "payload">): AutonomousActionCandidate {
  return {
    id: id(),
    domain: p.domain,
    actionType: p.actionType,
    riskLevel: p.riskLevel,
    confidence: typeof p.confidence === "number" ? p.confidence : 0.6,
    rationale: p.rationale,
    payload: p.payload,
    requiresApproval: p.requiresApproval ?? false,
    blockedReasons: p.blockedReasons ?? [],
    sourceAgent: p.sourceAgent ?? "action-candidate-builder",
    sourceStrategyKey: p.sourceStrategyKey,
    relatedEntityIds: p.relatedEntityIds ?? {},
    policyFlags: p.policyFlags ?? [],
    createdAt: new Date().toISOString(),
  };
}

function hintNum(h: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = h[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function hintStr(h: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = h[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Deterministic candidate generation from optional intelligence hints — never throws. */
export function buildAutonomousActionCandidates(input: BuildCandidatesInput): AutonomousActionCandidate[] {
  try {
    const out: AutonomousActionCandidate[] = [];
    const src = input.sourceAgent ?? "multi_source";
    const sk = input.sourceStrategyKey;

    const pushDeal = (dealId: string | undefined, priority: number, stalled: boolean) => {
      if (!dealId) return;
      out.push(
        baseCandidate({
          domain: "DEAL",
          actionType: "PRIORITIZE_DEAL",
          riskLevel: stalled ? "MEDIUM" : "LOW",
          rationale: stalled
            ? "Deal shows stall signals — suggest internal prioritization for broker review."
            : "High-priority deal surfaced from portfolio intelligence.",
          payload: { dealId, priorityScore: priority, stalled },
          requiresApproval: false,
          relatedEntityIds: { dealId },
          sourceAgent: src,
          sourceStrategyKey: sk,
          confidence: stalled ? 0.72 : 0.65,
        })
      );
    };

    for (const h of input.portfolioHints ?? []) {
      const dealId = hintStr(h, "dealId", "id");
      const pri = hintNum(h, "priority", "priorityScore", "score") ?? 50;
      const stalled = Boolean(h.stalled ?? h.atRisk ?? h.aging);
      pushDeal(dealId, pri, stalled);
      if (hintNum(h, "brokerLoad", "load") != null && (hintNum(h, "brokerLoad", "load") as number) > 0.85) {
        out.push(
          baseCandidate({
            domain: "PORTFOLIO",
            actionType: "ESCALATE_TO_HUMAN",
            riskLevel: "MEDIUM",
            rationale:
              "Broker capacity signal high — suggest rebalancing or human review (explainable load heuristic).",
            payload: { brokerId: input.brokerId, load: h.brokerLoad ?? h.load },
            requiresApproval: true,
            relatedEntityIds: {},
            sourceAgent: src,
            sourceStrategyKey: sk,
            confidence: 0.55,
          })
        );
      }
    }

    for (const h of input.crmInsights ?? []) {
      const leadId = hintStr(h, "leadId", "id");
      if (leadId && (h.stalled || h.needsFollowUp)) {
        out.push(
          baseCandidate({
            domain: "LEAD",
            actionType: "CREATE_FOLLOWUP_TASK",
            riskLevel: "LOW",
            rationale: "Stalled lead — internal follow-up task suggestion (not an outbound send).",
            payload: { leadId, reason: "stalled" },
            requiresApproval: false,
            relatedEntityIds: { leadId },
            sourceAgent: src,
            sourceStrategyKey: sk,
            confidence: 0.68,
          })
        );
      }
      if (leadId && h.strongFit) {
        out.push(
          baseCandidate({
            domain: "LEAD",
            actionType: "ROUTE_LEAD",
            riskLevel: "MEDIUM",
            rationale: "Qualified lead with strong fit — soft routing suggestion for broker confirmation.",
            payload: { leadId, targetBrokerId: input.brokerId },
            requiresApproval: true,
            relatedEntityIds: { leadId },
            sourceAgent: src,
            sourceStrategyKey: sk,
            confidence: 0.7,
          })
        );
      }
    }

    for (const h of input.orchestrationHints ?? []) {
      const m = hintStr(h, "message", "draft");
      if (m) {
        out.push(
          baseCandidate({
            domain: "MESSAGING",
            actionType: "GENERATE_MESSAGE_DRAFT",
            riskLevel: "MEDIUM",
            rationale: "Draft message from orchestration — draft-only, never auto-send.",
            payload: { draft: m.slice(0, 4000) },
            requiresApproval: true,
            blockedReasons: [],
            sourceAgent: src,
            sourceStrategyKey: sk,
            confidence: 0.6,
          })
        );
      }
    }

    for (const h of input.listingIntelligence ?? []) {
      const listingId = hintStr(h, "listingId", "id");
      if (listingId) {
        out.push(
          baseCandidate({
            domain: "LISTING",
            actionType: "RANK_LISTINGS",
            riskLevel: "LOW",
            rationale: "Listing match ranking suggestion — internal ordering only.",
            payload: { listingId, weight: hintNum(h, "weight", "score") ?? 1 },
            requiresApproval: false,
            relatedEntityIds: { listingId },
            sourceAgent: src,
            sourceStrategyKey: sk,
            confidence: 0.58,
          })
        );
      }
    }

    for (const h of input.negotiationHints ?? []) {
      out.push(
        baseCandidate({
          domain: "NEGOTIATION",
          actionType: "GENERATE_NEGOTIATION_BRIEF",
          riskLevel: "HIGH",
          rationale: "Negotiation brief — advisory document, no offer submission.",
          payload: { summary: JSON.stringify(h).slice(0, 8000) },
          requiresApproval: true,
          sourceAgent: src,
          sourceStrategyKey: sk,
          confidence: 0.5,
        })
      );
    }

    for (const h of input.playbookOutputs ?? []) {
      const eid = hintStr(h, "entityId", "leadId", "dealId");
      out.push(
        baseCandidate({
          domain: "PLAYBOOK",
          actionType: "TAG_LEAD",
          riskLevel: "LOW",
          rationale: "Playbook-derived tag suggestion for CRM hygiene.",
          payload: { tag: hintStr(h, "tag") ?? "playbook", entityId: eid },
          requiresApproval: false,
          relatedEntityIds: { leadId: hintStr(h, "leadId") },
          sourceAgent: src,
          sourceStrategyKey: sk,
          confidence: 0.52,
        })
      );
    }

    autonomyLog.candidatesBuilt(out.length, { brokerId: input.brokerId ?? null });
    return out;
  } catch {
    return [];
  }
}
