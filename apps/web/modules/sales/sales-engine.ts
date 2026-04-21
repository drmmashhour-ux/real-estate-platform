/**
 * Sales automation engine: activity + timing → next message + channel preference.
 */

import { formatSalesMessage, type FormattedSalesMessage, type SalesChannel, type SalesScriptId } from "./message-generator";
import type { LeadConversationTrigger } from "./lead-conversation.flow";
import { suggestedScriptForTrigger } from "./lead-conversation.flow";
import { salesConversionLog, salesLog } from "./sales-logger";

export type SalesEngineTrigger = LeadConversationTrigger;

export type SalesEngineInput = {
  trigger: SalesEngineTrigger;
  /** Last script successfully delivered */
  lastDeliveredScriptId?: SalesScriptId;
  /** Hours since last outbound touch (for suppression / escalation) */
  hoursSinceOutbound?: number;
  /** Soft signals */
  smsOptIn?: boolean;
  /** Prefer chat when user is in session */
  userInAppSession?: boolean;
};

export type SalesEngineOutput = {
  scriptId: SalesScriptId;
  recommendedChannel: SalesChannel;
  /** Attempt order for workers (respect opt-in before SMS) */
  channels: SalesChannel[];
  messages: Record<SalesChannel, FormattedSalesMessage>;
  rationale: string[];
  /** True when cadence rules say “do not send yet” (caller should reschedule). */
  suppressed: boolean;
};

function pickPrimaryChannel(input: SalesEngineInput): SalesChannel {
  if (input.userInAppSession) return "in_app";
  if (input.trigger === "lead_created") return "email";
  if (input.smsOptIn && (input.trigger === "no_response_24h" || input.hoursSinceOutbound != null && input.hoursSinceOutbound >= 24)) {
    return "sms";
  }
  if (input.trigger === "email_opened") return "email";
  return "in_app";
}

function buildChannelOrder(primary: SalesChannel, input: SalesEngineInput): SalesChannel[] {
  const rest: SalesChannel[] = ["email", "in_app", "sms"];
  const ordered = [primary, ...rest.filter((c) => c !== primary)];
  if (!input.smsOptIn) return ordered.filter((c) => c !== "sms");
  return ordered;
}

/**
 * Computes the next outbound touch for a lead nurture sequence.
 * Does not send messages — callers enqueue jobs / persist cadence state.
 */
export function evaluateSalesMessage(input: SalesEngineInput): SalesEngineOutput {
  const rationale: string[] = [];

  const suppressed =
    input.hoursSinceOutbound != null &&
    input.hoursSinceOutbound < 2 &&
    input.trigger !== "lead_created";

  if (suppressed) {
    rationale.push("suppress_fast_repeat");
  }

  const scriptId = suggestedScriptForTrigger({
    trigger: input.trigger,
    lastDeliveredScriptId: input.lastDeliveredScriptId,
  });

  if (input.trigger === "no_response_24h") {
    rationale.push("escalate_after_silence");
  }

  const recommendedChannel = pickPrimaryChannel(input);
  const channels = buildChannelOrder(recommendedChannel, input);

  const messages = {
    sms: formatSalesMessage(scriptId, "sms"),
    email: formatSalesMessage(scriptId, "email"),
    in_app: formatSalesMessage(scriptId, "in_app"),
  } satisfies Record<SalesChannel, FormattedSalesMessage>;

  if (!suppressed) {
    salesLog.info("sales_engine_evaluated", {
      trigger: input.trigger,
      scriptId,
      recommendedChannel,
      smsOptIn: Boolean(input.smsOptIn),
    });
    salesConversionLog.info("sales_touch_planned", { scriptId, channels: channels.join(",") });
  } else {
    salesLog.warn("sales_engine_suppressed", { trigger: input.trigger, hoursSinceOutbound: input.hoursSinceOutbound });
  }

  return {
    scriptId,
    recommendedChannel,
    channels,
    messages,
    rationale,
    suppressed,
  };
}
