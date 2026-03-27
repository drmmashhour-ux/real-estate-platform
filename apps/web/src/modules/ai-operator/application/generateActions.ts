import type { AiOperatorContext } from "@/src/modules/ai-operator/domain/operator.enums";
import type { GeneratedAiOperatorAction } from "@/src/modules/ai-operator/domain/operator.types";

function num(snapshot: Record<string, unknown>, key: string): number | undefined {
  const v = snapshot[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function str(snapshot: Record<string, unknown>, key: string): string | undefined {
  const v = snapshot[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Deterministic, explainable action proposals (no LLM) — stable for tests and production baselines.
 */
export function generateActions(context: AiOperatorContext, snapshot: Record<string, unknown> = {}): GeneratedAiOperatorAction[] {
  const out: GeneratedAiOperatorAction[] = [];

  switch (context) {
    case "deal_analysis": {
      const dealScore = num(snapshot, "dealScore");
      const trustScore = num(snapshot, "trustScore");
      const listingId = str(snapshot, "listingId");
      const dataUsed = [
        dealScore != null ? `dealScore=${dealScore}` : null,
        trustScore != null ? `trustScore=${trustScore}` : null,
        listingId ? `listingId=${listingId}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      if (listingId) {
        out.push({
          type: "run_simulation",
          context,
          title: "Run offer-strategy simulation",
          description: "Model conservative vs aggressive offers against list price for this listing.",
          reason: "A listing context is available; simulations help structure negotiation without committing to terms.",
          confidenceScore: dealScore != null && dealScore >= 60 ? 0.88 : 0.72,
          suggestedExecution: { kind: "navigate", path: `/listings/${listingId}`, query: { tab: "analyze" } },
          dataUsedSummary: dataUsed || "listing context",
          expectedOutcome: "Illustrative scenarios and risk notes for discussion with a professional.",
          payload: { listingId, dealScore, trustScore },
        });
      }

      if (dealScore != null && dealScore < 55) {
        out.push({
          type: "adjust_price",
          context,
          title: "Review pricing strategy",
          description: "Deal score is soft; consider repricing evidence or comparables before going firm.",
          reason: "Low deal score vs thresholds in snapshot suggests pricing or condition risk.",
          confidenceScore: 0.65,
          suggestedExecution: { kind: "ui_hint", panel: "pricing_review" },
          dataUsedSummary: dataUsed || "deal score",
          expectedOutcome: "Clearer ask aligned to market signals (advisory only).",
          payload: { dealScore, suggestedDirection: "review_comparables" },
        });
      }
      break;
    }
    case "lead_management": {
      const leadId = str(snapshot, "leadId") ?? str(snapshot, "brokerClientId");
      const daysSinceContact = num(snapshot, "daysSinceContact");
      out.push({
        type: leadId ? "follow_up_lead" : "contact_lead",
        context,
        title: leadId ? "Schedule lead follow-up" : "Prioritize lead outreach",
        description: leadId
          ? "Send a structured follow-up while context is fresh."
          : "Pick the next best lead from your pipeline for contact.",
        reason:
          daysSinceContact != null && daysSinceContact > 3
            ? "No recent contact signal in snapshot exceeds follow-up window."
            : "CRM activity trigger: keep pipeline velocity without spamming.",
        confidenceScore: 0.74,
        suggestedExecution: leadId
          ? { kind: "open_crm_client", brokerClientId: leadId }
          : { kind: "navigate", path: "/dashboard/broker/crm" },
        dataUsedSummary: [leadId && `leadId=${leadId}`, daysSinceContact != null && `daysSinceContact=${daysSinceContact}`]
          .filter(Boolean)
          .join(", ") || "crm snapshot",
        expectedOutcome: "Logged touchpoint or drafted message — no auto-send without approval.",
        payload: { leadId, daysSinceContact },
      });
      break;
    }
    case "drafting": {
      const documentId = str(snapshot, "documentId");
      out.push({
        type: "generate_draft",
        context,
        title: "Complete missing declaration sections",
        description: "Use template-safe drafting to fill gaps flagged by validation.",
        reason: "Drafting context implies incomplete or evolving documents; controlled AI assists only where allowed.",
        confidenceScore: 0.7,
        suggestedExecution: documentId
          ? { kind: "navigate", path: `/client-documents/${documentId}` }
          : { kind: "navigate", path: "/dashboard/seller/documents" },
        dataUsedSummary: documentId ? `documentId=${documentId}` : "drafting context",
        expectedOutcome: "Human-reviewed text suggestions — you approve every change.",
        payload: { documentId },
      });
      break;
    }
    case "negotiation": {
      const offerId = str(snapshot, "offerId");
      out.push({
        type: "run_simulation",
        context,
        title: "Stress-test offer structure",
        description: "Compare scenarios before countering so terms stay coherent.",
        reason: "Negotiation updates benefit from structured scenario comparison (illustrative).",
        confidenceScore: 0.8,
        suggestedExecution: offerId
          ? { kind: "navigate", path: `/dashboard/broker/offers`, query: { highlight: offerId } }
          : { kind: "navigate", path: "/dashboard/broker/contracts-offers" },
        dataUsedSummary: offerId ? `offerId=${offerId}` : "negotiation context",
        expectedOutcome: "Internal alignment on numbers and conditions before messaging counterparties.",
        payload: { offerId },
      });
      break;
    }
    case "growth": {
      out.push({
        type: "publish_content",
        context,
        title: "Queue a review-ready post",
        description: "Draft social copy from performance signals — human publish only.",
        reason: "Growth context: reinforce channels that already convert; no auto-posting.",
        confidenceScore: 0.62,
        suggestedExecution: { kind: "navigate", path: "/admin/growth-engine" },
        dataUsedSummary: str(snapshot, "channel") ? `channel=${snapshot.channel}` : "growth snapshot",
        expectedOutcome: "Draft asset in review queue — you choose time and channel.",
        payload: { channel: snapshot.channel },
      });
      break;
    }
    case "monetization": {
      const plan = str(snapshot, "plan");
      out.push({
        type: "trigger_upgrade_prompt",
        context,
        title: "Surface upgrade at the right moment",
        description: "After a value moment, show upgrade paths — never charge automatically.",
        reason: "Billing or usage snapshot indicates user hit a limit or value threshold.",
        confidenceScore: 0.68,
        suggestedExecution: { kind: "show_upgrade_modal", source: "ai_operator" },
        dataUsedSummary: plan ? `plan=${plan}` : "billing snapshot",
        expectedOutcome: "Informed upgrade choice; checkout only if user confirms.",
        payload: { plan, usagePercent: num(snapshot, "usagePercent") },
      });
      break;
    }
    case "team_workspace": {
      const workspaceId = str(snapshot, "workspaceId");
      const activeDeals = num(snapshot, "activeDealCount");
      const riskAlerts = num(snapshot, "riskAlertCount");
      const brokerUserId = str(snapshot, "brokerUserId");
      const staleDeals = num(snapshot, "staleDealCount");

      out.push({
        type: "run_simulation",
        context,
        title: "Team pipeline risk review",
        description:
          "Aggregate deal stages and flags suggest a structured review before week-end reporting.",
        reason:
          riskAlerts != null && riskAlerts > 0
            ? "Open compliance or document gaps detected across workspace deals."
            : "Periodic team oversight keeps stalled files visible.",
        confidenceScore: riskAlerts != null && riskAlerts > 2 ? 0.86 : 0.7,
        suggestedExecution: workspaceId
          ? { kind: "navigate", path: `/dashboard/workspaces/${workspaceId}/team` }
          : { kind: "navigate", path: "/dashboard/tenant" },
        dataUsedSummary: [
          workspaceId && `workspaceId=${workspaceId}`,
          activeDeals != null && `activeDeals=${activeDeals}`,
          riskAlerts != null && `riskAlerts=${riskAlerts}`,
        ]
          .filter(Boolean)
          .join(", ") || "team snapshot",
        expectedOutcome: "Managers prioritize exceptions; no automatic state changes.",
        payload: { workspaceId, activeDealCount: activeDeals, riskAlertCount: riskAlerts },
      });

      if (brokerUserId) {
        out.push({
          type: "follow_up_lead",
          context,
          title: "Broker-specific follow-up queue",
          description: "Surface the next touchpoints for this producer based on team CRM signals.",
          reason:
            staleDeals != null && staleDeals > 0
              ? "Stale deals in workspace may need producer-level nudges."
              : "Team mode: align individual activity with org pipeline goals.",
          confidenceScore: 0.72,
          suggestedExecution: { kind: "navigate", path: "/dashboard/broker/crm" },
          dataUsedSummary: `brokerUserId=${brokerUserId}`,
          expectedOutcome: "Logged follow-up tasks — human executes outreach.",
          payload: { brokerUserId, workspaceId, staleDealCount: staleDeals },
        });
      }
      break;
    }
    case "monopoly_learning": {
      const workspaceId = str(snapshot, "workspaceId");
      const outcome = str(snapshot, "outcome");
      const historyRows = num(snapshot, "historyRows");
      out.push({
        type: "run_simulation",
        context,
        title: "Refresh internal benchmarks after outcome",
        description:
          "New terminal outcome logged — compare cycle time and win rate inside your organization only.",
        reason:
          outcome === "lost"
            ? "Loss events are high-signal for coaching and checklist updates."
            : "Outcome data compounds defensibility when aggregated within the workspace.",
        confidenceScore: 0.75,
        suggestedExecution: workspaceId
          ? { kind: "navigate", path: `/dashboard/workspaces/${workspaceId}/monopoly` }
          : { kind: "navigate", path: "/dashboard/tenant" },
        dataUsedSummary: [workspaceId && `workspaceId=${workspaceId}`, outcome && `outcome=${outcome}`]
          .filter(Boolean)
          .join(", ") || "monopoly learning",
        expectedOutcome: "Human reviews benchmarks; no automatic repricing or messaging.",
        payload: { workspaceId, outcome, historyRows },
      });
      break;
    }
    default:
      break;
  }

  return out;
}
