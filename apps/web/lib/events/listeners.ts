import { isFraudAutoExecuteEnabled } from "@/lib/config/ops-flags";
import { canAutoApply } from "@/lib/ai/autoApplyPolicy";
import { executeActions, type AutonomousAction } from "@/lib/ai/executor";
import { runAutonomousAgent, type AutonomousAgentListing } from "@/lib/ai/orchestrator";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { logAiError, logFraud } from "@/lib/observability/structured-log";
import { runAutoListingOptimizerOnEvent } from "@/lib/ai/auto-optimizer-event-hook";
import { buildRiskActions } from "@/lib/ai/riskActions";
import { getRiskDataFromBookingEvent } from "@/lib/ai/risk-data";
import { computeRisk } from "@/lib/ai/riskEngine";
import { recordRiskEvent } from "@/lib/ai/risk-audit";
import { riskDecision } from "@/lib/ai/riskDecision";
import type { AutonomousAction } from "@/lib/ai/executor";

type OnFn = (event: string, handler: (p: Record<string, unknown>) => void | Promise<void>) => void;

/**
 * In-process event wiring for autonomous follow-ups. Call with `on` from `lib/events` (no import cycle).
 * DB writes in `listing.updated` only when `AUTONOMOUS_LOOP_EXEC=1`.
 */
export function registerEventListeners(on: OnFn) {
  on("listing.updated", async (raw) => {
    const listing = raw as AutonomousAgentListing;
    if (!listing?.id || typeof listing.id !== "string") {
      return;
    }
    try {
    const actions = await runAutonomousAgent(listing);
    const safeAutoOnly = process.env.AI_AUTO_APPLY_SAFE === "1";
    const toApply: AutonomousAction[] = safeAutoOnly
      ? actions.filter((a) => canAutoApply(a as AutonomousAction))
      : actions;
    if (process.env.AUTONOMOUS_LOOP_EXEC === "1" && !isDemoMode) {
      const st =
        typeof listing.shortTermListingId === "string" && listing.shortTermListingId.trim()
          ? listing.shortTermListingId.trim()
          : undefined;
      try {
        await executeActions(toApply, {
          marketplaceListingId: listing.id,
          crmListingId:
            typeof listing.crmListingId === "string" && listing.crmListingId.trim()
              ? listing.crmListingId.trim()
              : undefined,
          shortTermListingId: st,
          requireConversionAbWin: true,
        });
      } catch (e) {
        logAiError("executeActions", e, { event: "listing.updated", listingId: listing.id });
      }
    } else {
      console.log(
        "[autonomous] listing.updated — dry run (set AUTONOMOUS_LOOP_EXEC=1 to apply actions)",
        { actions, toApply: safeAutoOnly ? toApply : actions, safeAutoOnly }
      );
    }
    } catch (e) {
      logAiError("listing.updated handler", e, { listingId: typeof raw === "object" && raw && "id" in raw ? String((raw as { id?: string }).id) : undefined });
    }
  });

  on("booking.created", async (data) => {
    try {
      await runAutoListingOptimizerOnEvent(data);
    } catch (e) {
      console.error("[events] booking.created — auto listing optimizer", e);
    }

    const raw = data as Record<string, unknown>;
    try {
      const ctx = await getRiskDataFromBookingEvent(raw);
      if (!ctx) return;
      const { crmListingId, userId: resolvedUserId, ...riskInput } = ctx;
      const score = computeRisk(riskInput);
      const decision = riskDecision(score);
      if (decision === "allow") return;

      const listingId = typeof raw.listingId === "string" && raw.listingId.trim() ? raw.listingId.trim() : null;
      const isBnhub = raw.source === "bnhub";
      const userId = resolvedUserId ?? (typeof raw.userId === "string" ? raw.userId.trim() : null);

      logFraud("risk_decision", { listingId, userId, score, decision, source: raw.source });

      try {
        await recordRiskEvent({
          listingId,
          userId,
          score,
          decision,
        });
      } catch (e) {
        console.error("[events] recordRiskEvent", e);
      }

      let actions: AutonomousAction[] = buildRiskActions(decision);
      if (isBnhub && decision === "block") {
        // `compliance_block` updates monolith `Listing` by id; BNHub events carry `ShortTermListing.id` — not a CRM row id.
        actions = [
          { type: "manual_review_flag", reason: "fraud_risk: bnhub_stay (CRM hold not mapped to Listing.id)" },
        ];
      }

      if (process.env.AUTONOMOUS_LOOP_EXEC === "1" && !isDemoMode && isFraudAutoExecuteEnabled()) {
        try {
          await executeActions(actions, {
            marketplaceListingId: isBnhub ? undefined : listingId ?? undefined,
            crmListingId: isBnhub ? undefined : crmListingId,
            shortTermListingId: isBnhub && listingId ? listingId : undefined,
            requireConversionAbWin: false,
          });
        } catch (e) {
          logAiError("executeActions fraud path", e, { listingId, decision });
        }
      } else {
        logFraud("execute_skipped", {
          reason: !isFraudAutoExecuteEnabled() ? "ENABLE_FRAUD_BLOCK=0" : "dry_run",
          actions,
          listingId,
          score,
          decision,
        });
      }
    } catch (e) {
      console.error("[events] booking.created — risk engine", e);
    }
  });
}
