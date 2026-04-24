import type {
  CommandPriorityBuckets,
  EngineRecommendation,
  UnifiedCommandContext,
} from "./command-center-ai.types";
import type { CommandCenterRecommendationCategory } from "@prisma/client";

function baseReason(
  why: string,
  expectedImpact: string,
  riskOrBlocker: string,
  explainability: string[],
): EngineRecommendation["reasoningJson"] {
  return { why, expectedImpact, riskOrBlocker, explainability };
}

/**
 * Explainable next actions — scores are heuristic ranks for ordering, not legal advice.
 */
export function buildCommandRecommendations(
  context: UnifiedCommandContext,
  priorities: CommandPriorityBuckets,
): EngineRecommendation[] {
  const recs: EngineRecommendation[] = [];

  const push = (r: EngineRecommendation) => {
    recs.push(r);
  };

  for (const s of context.signatureQueue) {
    if (s.severity === "LOW") continue;
    const category: CommandCenterRecommendationCategory = "APPROVE";
    const score = s.severity === "CRITICAL" ? 96 : s.severity === "HIGH" ? 88 : 72;
    push({
      category,
      entityType: s.kind,
      entityId: s.id,
      score,
      reasoningJson: baseReason(
        "A governed document or autopilot step is waiting for your explicit approval or signature.",
        "Clears the legal gate so parties can rely on the instrument and timelines can advance.",
        "Signing without reading supervisory notes can create liability; verify facts and instructions first.",
        [
          `Queue item: ${s.title}`,
          "Platform policy: no binding execution without broker approval where required.",
          s.kind === "action_pipeline" ? "Autopilot drafted content — you remain the decision-maker." : "Review the underlying form in the review queue when applicable.",
        ],
      ),
    });
  }

  for (const d of context.deals) {
    if (d.stage !== "CONFLICT_REQUIRES_DISCLOSURE") continue;
    push({
      category: "ESCALATE",
      entityType: "deal",
      entityId: d.dealId,
      score: 93,
      reasoningJson: baseReason(
        "Conflict-of-interest disclosure is unresolved on an active file.",
        "Restores compliant representation and reduces regulatory and civil exposure.",
        "Proceeding without disclosure may breach OACIQ duties to parties.",
        [
          `Deal reference: ${d.dealCode ?? d.dealId}`,
          d.blocker ? `Current blocker: ${d.blocker}` : "Clear the disclosure workflow before marketing or negotiating further.",
        ],
      ),
    });
  }

  for (const d of context.deals) {
    const cp = d.closeProbability ?? 0;
    if (cp >= 0.68 && !d.needsBrokerSignature) {
      push({
        category: "FOLLOW_UP",
        entityType: "deal",
        entityId: d.dealId,
        score: 78 + Math.round(cp * 12),
        reasoningJson: baseReason(
          "Modeled probability indicates the transaction is warm — counterparty momentum may need a nudge.",
          "Shortens cycle time and protects against silent stall.",
          "Over-communication can fatigue clients; keep notes in the CRM.",
          [
            `Close probability ~${Math.round(cp * 100)}%`,
            `Next step hint: ${d.nextStep}`,
            "Log outreach in the lead/deal record for auditability.",
          ],
        ),
      });
      break;
    }
  }

  for (const c of context.closings) {
    if (c.blockedChecklist === 0) continue;
    push({
      category: "REVIEW",
      entityType: "closing",
      entityId: c.dealId,
      score: 86,
      reasoningJson: baseReason(
        "A blocked checklist item is preventing a clean path to signing or disbursement.",
        "Unblocks notary instructions and reduces last-minute rescission risk.",
        "Some items require third parties — confirm who must act before you chase internally.",
        [
          `${c.blockedChecklist} blocked item(s)`,
          c.closingDate ? `Target closing: ${c.closingDate.slice(0, 10)}` : "Set or confirm a signing date with the notary.",
        ],
      ),
    });
  }

  if (context.finance.invoicesOverdue > 0) {
    push({
      category: "PRIORITIZE",
      entityType: "finance",
      entityId: context.userId,
      score: 84,
      reasoningJson: baseReason(
        "Overdue invoices signal collection risk and can distort quarterly tax positions.",
        "Improves cash and reduces write-off probability.",
        "Aggressive collection may affect client relationships — document attempts.",
        [`${context.finance.invoicesOverdue} invoice(s) overdue`, "Pair collection with accurate GST/QST coding."],
      ),
    });
  }

  for (const inv of context.investors) {
    if (!/PROPOSED|PENDING/i.test(inv.decisionStatus)) continue;
    push({
      category: "REVIEW",
      entityType: "lecipm_pipeline_deal",
      entityId: inv.id,
      score: 70,
      reasoningJson: baseReason(
        "An investor packet or commitment appears to be waiting on internal release or signatures.",
        "Keeps capital partners aligned and avoids stale offerings.",
        "Securities and advertising rules may apply — use governed templates only.",
        [`Pipeline stage: ${inv.stage}`, `Status: ${inv.decisionStatus}`],
      ),
    });
    break;
  }

  for (const strategic of context.legacy.strategicRecommendations.slice(0, 4)) {
    const category: CommandCenterRecommendationCategory = strategic.requiresApproval ? "REVIEW" : "PRIORITIZE";
    push({
      category,
      entityType: "strategic_recommendation",
      entityId: strategic.id,
      score: 65 + (strategic.requiresApproval ? 8 : 0),
      reasoningJson: baseReason(
        strategic.title,
        strategic.expectedImpact,
        strategic.requiresApproval ? "Action may require formal approval — do not automate execution." : "Validate against your local market facts.",
        [strategic.explanation, ...(strategic.actions ?? []).map((a) => `${a.label}${a.href ? ` → ${a.href}` : ""}`)],
      ),
    });
  }

  for (const item of priorities.ACT_NOW.slice(0, 3)) {
    if (item.id.startsWith("deal:")) {
      const dealId = item.id.replace("deal:", "");
      push({
        category: "PRIORITIZE",
        entityType: "deal",
        entityId: dealId,
        score: 82,
        reasoningJson: baseReason(
          item.title,
          "Focuses broker time on the highest-velocity or highest-risk file today.",
          item.detail ?? "Confirm no material facts changed since the last review.",
          item.explainability,
        ),
      });
    }
  }

  recs.sort((a, b) => b.score - a.score);

  const dedup = new Map<string, EngineRecommendation>();
  for (const r of recs) {
    const k = `${r.entityType}:${r.entityId}`;
    const prev = dedup.get(k);
    if (!prev || prev.score < r.score) dedup.set(k, r);
  }
  return [...dedup.values()].sort((a, b) => b.score - a.score).slice(0, 40);
}
