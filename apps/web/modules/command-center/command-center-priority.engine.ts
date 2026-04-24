import type {
  CommandPriorityBucket,
  CommandPriorityBuckets,
  PriorityItem,
  UnifiedCommandContext,
} from "./command-center-ai.types";

function explain(...lines: (string | null | undefined)[]): string[] {
  return lines.filter((x): x is string => Boolean(x && x.trim()));
}

function laneToUrgency(lane: string): number {
  if (lane === "urgent") return 88;
  if (lane === "attention") return 58;
  return 28;
}

/** Composite attention score for ranking within a bucket. */
function rankScore(item: PriorityItem): number {
  return item.urgencyScore * 1.4 + item.valueScore;
}

function sortBucket(items: PriorityItem[]): PriorityItem[] {
  return [...items].sort((a, b) => rankScore(b) - rankScore(a));
}

/**
 * Broker-first prioritization: legal approval gates, near-close velocity, compliance, and capital actions surface first.
 */
export function buildCommandPriorities(context: UnifiedCommandContext): CommandPriorityBuckets {
  const buckets: Record<CommandPriorityBucket, PriorityItem[]> = {
    ACT_NOW: [],
    REVIEW_TODAY: [],
    WAITING_FOR_OTHERS: [],
    AI_ALREADY_HANDLED: [],
    LOW_PRIORITY: [],
  };
  const seen = new Set<string>();

  const push = (bucket: CommandPriorityBucket, item: PriorityItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    buckets[bucket].push(item);
  };

  for (const s of context.signatureQueue) {
    const id = `sig:${s.kind}:${s.id}`;
    const urgency = s.severity === "CRITICAL" ? 96 : s.severity === "HIGH" ? 82 : 52;
    const valueScore = s.kind === "action_pipeline" ? 92 : s.kind === "contract" ? 85 : 68;
    const item: PriorityItem = {
      id,
      title: s.title,
      href: s.href,
      urgencyScore: urgency,
      valueScore,
      explainability: explain(
        "Binding steps stay queued until you review and sign where required.",
        s.kind === "action_pipeline" ? "Autopilot drafted this action; execution is not silent." : null,
      ),
    };
    push(urgency >= 90 ? "ACT_NOW" : "REVIEW_TODAY", item);
  }

  if (context.conflictDeals > 0) {
    push("ACT_NOW", {
      id: "compliance:conflict-deals",
      title: `${context.conflictDeals} deal(s) require conflict disclosure`,
      detail: "Resolve before further representation steps that could prejudice a party.",
      href: "/dashboard/broker/compliance/command-center",
      urgencyScore: 94,
      valueScore: 90,
      explainability: explain("Conflict status is a compliance blocker across the affected files."),
    });
  }

  if (context.finance.invoicesOverdue > 0) {
    push("ACT_NOW", {
      id: "finance:overdue-invoices",
      title: `${context.finance.invoicesOverdue} overdue invoice(s)`,
      href: "/dashboard/broker/financial/transactions",
      urgencyScore: 80,
      valueScore: 74,
      explainability: explain(
        "Receivables age affects cash flow and GST/QST reporting discipline.",
        context.finance.taxHint ?? undefined,
      ),
    });
  }

  for (const c of context.closings) {
    if (c.blockedChecklist === 0 && c.pendingSignatures === 0) continue;
    const id = `closing:${c.dealId}`;
    const urgency = 72 + Math.min(18, c.blockedChecklist * 6) + Math.min(10, c.pendingSignatures * 2);
    const item: PriorityItem = {
      id,
      title: `Closing · ${c.dealId.slice(0, 8)}`,
      detail:
        c.blockedChecklist > 0 ?
          `${c.blockedChecklist} blocked checklist item(s); ${c.pendingSignatures} signature(s) pending`
        : `${c.pendingSignatures} signature(s) pending on closing documents`,
      href: c.href,
      urgencyScore: urgency,
      valueScore: 78,
      explainability: explain(
        "Notary and disbursement timelines depend on cleared conditions and executed signatures.",
        c.readiness ? `Readiness: ${c.readiness}` : null,
      ),
    };
    push(c.blockedChecklist > 0 || c.pendingSignatures >= 2 ? "ACT_NOW" : "REVIEW_TODAY", item);
  }

  for (const d of context.deals) {
    const cp = d.closeProbability ?? 0;
    const valueScore = Math.min(
      95,
      38 + Math.round(cp * 38) + Math.min(22, Math.log10(d.priceCents + 10) * 4) + (d.dealScore != null ? Math.min(12, d.dealScore / 8) : 0),
    );
    let urgency = 32 + Math.round(cp * 34);
    if (d.needsBrokerSignature) urgency += 22;
    if (d.stage === "CONFLICT_REQUIRES_DISCLOSURE" || d.blocker?.includes("Conflict")) urgency += 38;
    if (d.blocker?.includes("Checklist blocked")) urgency += 18;
    if (d.blocker?.includes("Broker approval")) urgency += 12;

    const item: PriorityItem = {
      id: `deal:${d.dealId}`,
      title: d.dealCode ? `Deal ${d.dealCode}` : `Deal ${d.dealId.slice(0, 8)}`,
      detail: d.blocker ?? d.nextStep,
      href: d.href,
      urgencyScore: Math.min(99, urgency),
      valueScore,
      explainability: explain(
        d.dealScore != null ? `Deal score ${d.dealScore}${d.dealScoreCategory ? ` (${d.dealScoreCategory})` : ""}` : null,
        cp > 0 ? `Modeled close probability ~${Math.round(cp * 100)}%` : null,
        d.nextStep ? `Suggested next step: ${d.nextStep}` : null,
        d.needsBrokerSignature ? "Your signature or approval is still gating progress." : null,
      ),
    };

    const hotClose = cp >= 0.62;
    const complianceBlocked = d.stage === "CONFLICT_REQUIRES_DISCLOSURE" || Boolean(d.blocker?.includes("Conflict"));

    if (complianceBlocked || (d.needsBrokerSignature && hotClose)) {
      push("ACT_NOW", item);
    } else if (d.needsBrokerSignature || hotClose || (d.dealScore != null && d.dealScore >= 72)) {
      push("REVIEW_TODAY", item);
    } else if (!d.needsBrokerSignature && (hotClose || cp <= 0.25)) {
      push("WAITING_FOR_OTHERS", {
        ...item,
        explainability: explain(
          "No broker signature gate detected on this row — momentum likely depends on another party or third party.",
          d.blocker ?? undefined,
        ),
      });
    } else {
      push("LOW_PRIORITY", item);
    }
  }

  for (const inv of context.investors) {
    const waiting = /^(PENDING|PROPOSED|SUBMITTED|REVIEW)/i.test(inv.decisionStatus.trim() || "");
    const id = `investor:${inv.id}`;
    const item: PriorityItem = {
      id,
      title: inv.title,
      detail: `${inv.stage} · ${inv.decisionStatus}`,
      href: inv.href,
      urgencyScore: waiting ? 52 : 34,
      valueScore: 62,
      explainability: explain("Investor pipeline — commitments and packets often wait on counterparty counsel or capital desk."),
    };
    push(waiting ? "WAITING_FOR_OTHERS" : "LOW_PRIORITY", item);
  }

  for (const a of context.legacy.alerts) {
    if (a.severity !== "urgent") continue;
    push("ACT_NOW", {
      id: `legacy-alert:${a.id}`,
      title: a.title,
      href: a.href,
      urgencyScore: laneToUrgency(a.severity),
      valueScore: 64,
      explainability: explain("Pulled forward from governed approval and trust surfaces."),
    });
  }

  for (const ex of context.execution.aiHandled.slice(0, 12)) {
    push("AI_ALREADY_HANDLED", {
      id: `exec:${ex.id}`,
      title: ex.title,
      detail: ex.status,
      href: ex.href,
      urgencyScore: 18,
      valueScore: 36,
      explainability: explain(
        ex.aiGenerated ? "Autopilot executed after the governed signature/approval path." : "Recorded in the action pipeline for audit visibility.",
      ),
    });
  }

  return {
    ACT_NOW: sortBucket(buckets.ACT_NOW),
    REVIEW_TODAY: sortBucket(buckets.REVIEW_TODAY),
    WAITING_FOR_OTHERS: sortBucket(buckets.WAITING_FOR_OTHERS),
    AI_ALREADY_HANDLED: sortBucket(buckets.AI_ALREADY_HANDLED),
    LOW_PRIORITY: sortBucket(buckets.LOW_PRIORITY),
  };
}
