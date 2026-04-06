import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { classifyActionKey, mayAutoExecute } from "../policies/action-policy";
import type { DecisionMode } from "../types";
import { logManagerAction } from "../logger";
import {
  toolCreatePromotionSuggestion,
  toolUpdateSafeListingFields,
  toolCreateSupportSummary,
} from "../tools/registry";
import {
  recordAutopilotPromotionActIfApplicable,
  recordAutopilotPromotionDismissIfApplicable,
} from "../learning/host-autopilot-flow-hooks";

export type ExecuteBody = {
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  payload?: Record<string, unknown>;
};

export async function executeSafeManagerAction(input: {
  userId: string;
  decisionMode: DecisionMode;
  body: ExecuteBody;
  /** Explicit UI-triggered safe actions (still blocked for forbidden / approval-only keys). */
  allowManualSafe?: boolean;
}): Promise<{ ok: boolean; error?: string; result?: unknown }> {
  const { actionKey } = input.body;
  const cls = classifyActionKey(actionKey);
  if (cls === "forbidden") {
    return { ok: false, error: "forbidden_action" };
  }
  if (cls === "requires_approval") {
    return { ok: false, error: "use_approval_flow" };
  }
  const manualOk =
    input.allowManualSafe === true && (cls === "safe" || cls === "guardrail");
  const autopilotOk = mayAutoExecute(actionKey, input.decisionMode === "AUTO_EXECUTE_SAFE");
  if (!manualOk && !autopilotOk) {
    return { ok: false, error: "not_permitted_for_current_mode" };
  }

  const { targetEntityType, targetEntityId, payload = {} } = input.body;

  try {
    switch (actionKey) {
      case "draft_listing_copy": {
        const title = typeof payload.proposedTitle === "string" ? payload.proposedTitle : null;
        const description = typeof payload.proposedDescription === "string" ? payload.proposedDescription : null;
        await prisma.managerAiRecommendation.create({
          data: {
            userId: input.userId,
            agentKey: "listing_optimization",
            title: "Draft listing copy",
            description: "AI-suggested title/description — review before publishing.",
            confidence: typeof payload.confidence === "number" ? payload.confidence : 0.6,
            targetEntityType: "short_term_listing",
            targetEntityId,
            suggestedAction: "apply_listing_draft",
            status: "active",
            payload: { proposedTitle: title, proposedDescription: description } as object,
          },
        });
        await logManagerAction({
          userId: input.userId,
          actionKey,
          targetEntityType,
          targetEntityId,
          status: "executed",
          decisionMode: input.decisionMode,
          payload,
        });
        return { ok: true, result: { stored: "recommendation" } };
      }
      case "recommend_promotion":
      case "review_promotion": {
        const note = typeof payload.note === "string" ? payload.note : "Review promotion timing and discount depth.";
        const r = await toolCreatePromotionSuggestion(input.userId, targetEntityId, note);
        if (!r.ok) return { ok: false, error: r.error };
        if (targetEntityType === "short_term_listing") {
          try {
            await recordAutopilotPromotionActIfApplicable({
              userId: input.userId,
              listingId: targetEntityId,
            });
          } catch {
            /* learning must not affect execute flow */
          }
        }
        return { ok: true, result: r.data };
      }
      case "update_safe_listing_fields": {
        const r = await toolUpdateSafeListingFields(input.userId, targetEntityId, {
          subtitle: typeof payload.subtitle === "string" ? payload.subtitle : undefined,
          neighborhoodDetails: typeof payload.neighborhoodDetails === "string" ? payload.neighborhoodDetails : undefined,
        });
        if (!r.ok) return { ok: false, error: r.error };
        return { ok: true, result: r.data };
      }
      case "support_summary": {
        if (targetEntityType !== "booking") return { ok: false, error: "invalid_target" };
        const summary = typeof payload.summary === "string" ? payload.summary : "";
        const r = await toolCreateSupportSummary(input.userId, targetEntityId, summary);
        if (!r.ok) return { ok: false, error: r.error };
        return { ok: true, result: r.data };
      }
      case "dismiss_recommendation": {
        const rec = await prisma.managerAiRecommendation.findFirst({
          where: { id: targetEntityId, userId: input.userId },
          select: {
            agentKey: true,
            payload: true,
            targetEntityType: true,
            targetEntityId: true,
            confidence: true,
          },
        });
        await prisma.managerAiRecommendation.updateMany({
          where: { id: targetEntityId, userId: input.userId },
          data: { status: "dismissed" },
        });
        if (rec) {
          try {
            await recordAutopilotPromotionDismissIfApplicable({ userId: input.userId, rec });
          } catch {
            /* learning must not affect execute flow */
          }
        }
        return { ok: true, result: { dismissed: true } };
      }
      case "mark_booking_needs_review": {
        if (!(await isPlatformAdmin(input.userId))) return { ok: false, error: "forbidden" };
        const reason = typeof payload.reason === "string" ? payload.reason : "AI flagged for review";
        await prisma.managerAiRecommendation.create({
          data: {
            userId: input.userId,
            agentKey: "trust_safety",
            title: "Booking flagged",
            description: reason,
            confidence: 0.65,
            targetEntityType: "booking",
            targetEntityId,
            suggestedAction: "admin_review",
            status: "active",
          },
        });
        await logManagerAction({
          userId: input.userId,
          actionKey,
          targetEntityType,
          targetEntityId,
          status: "executed",
          payload,
        });
        return { ok: true, result: { flagged: true } };
      }
      default:
        return { ok: false, error: "unknown_or_requires_approval" };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "execute_failed";
    await logManagerAction({
      userId: input.userId,
      actionKey,
      targetEntityType,
      targetEntityId,
      status: "failed",
      error: { message: msg },
    });
    return { ok: false, error: msg };
  }
}
