import type { AiOperatorActionType } from "@/src/modules/ai-operator/domain/operator.enums";
import type { ActionExecutionResult } from "@/src/modules/ai-operator/domain/operator.types";

/**
 * Side-effect-free execution: returns navigation / next-step hints only.
 * No automatic messages, billing captures, or listing writes.
 */
export function runActionHandler(
  type: AiOperatorActionType,
  payload: Record<string, unknown>,
  editedPayload: Record<string, unknown> | null
): ActionExecutionResult {
  const p = { ...payload, ...(editedPayload ?? {}) };

  switch (type) {
    case "run_simulation": {
      const listingId = typeof p.listingId === "string" ? p.listingId : null;
      return {
        ok: true,
        message: listingId
          ? `Open simulator for listing ${listingId} from the listing or deal workspace.`
          : "Open growth first-value or listing analyzer from the dashboard.",
        details: { listingId, deepLink: listingId ? `/listings/${listingId}` : "/growth/first-value" },
      };
    }
    case "contact_lead":
    case "follow_up_lead": {
      const id = typeof p.leadId === "string" ? p.leadId : typeof p.brokerClientId === "string" ? p.brokerClientId : null;
      return {
        ok: true,
        message: "Draft logged — compose message in CRM; nothing was sent automatically.",
        details: { brokerClientId: id, crmPath: "/dashboard/broker/crm" },
      };
    }
    case "adjust_price": {
      return {
        ok: true,
        message: "Pricing review noted — apply any MLS or internal changes manually after broker approval.",
        details: { advisoryOnly: true },
      };
    }
    case "generate_draft": {
      const documentId = typeof p.documentId === "string" ? p.documentId : null;
      return {
        ok: true,
        message: "Continue in drafting UI; AI suggestions require your acceptance per section.",
        details: { documentId, path: documentId ? `/client-documents/${documentId}` : null },
      };
    }
    case "send_message": {
      return {
        ok: true,
        message: "Message not sent — copy draft from CRM or conversations after you review.",
        details: { autoSendBlocked: true },
      };
    }
    case "publish_content": {
      return {
        ok: true,
        message: "No channel post executed — finish in growth tools with human approval.",
        details: { autoPublishBlocked: true },
      };
    }
    case "trigger_upgrade_prompt": {
      return {
        ok: true,
        message: "Upgrade prompt may be shown in UI — Stripe checkout only on explicit click.",
        details: { billingAutoBlocked: true },
      };
    }
    default:
      return { ok: false, message: "Unknown action type" };
  }
}
