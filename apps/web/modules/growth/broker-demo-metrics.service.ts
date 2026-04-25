import { recordFunnelEvent } from "./funnel-tracking.service";

export type BrokerDemoMetricAction =
  | "demo_start"
  | "step_view"
  | "step_next"
  | "step_back"
  | "autoplay_on"
  | "autoplay_off"
  | "drop_or_leave"
  | "onboarding_cta"
  | "assign_sample_leads"
  | "complete_flow";

const DEMO_PATH = "/dashboard/broker-demo";

/**
 * Server-side: funnel rows for “demo → onboarding” and drop-off by step (see `metaJson.stepId`).
 */
export async function recordBrokerDemoEvent(input: {
  action: BrokerDemoMetricAction;
  stepId?: string;
  stepIndex?: number;
  sessionId?: string | null;
  userEmail?: string | null;
  extra?: Record<string, unknown>;
}) {
  const isConversion =
    input.action === "onboarding_cta" ||
    input.action === "assign_sample_leads" ||
    input.action === "complete_flow";

  await recordFunnelEvent({
    category: isConversion ? "CONVERSION" : "ACTIVATION",
    path: DEMO_PATH,
    sessionId: input.sessionId,
    email: input.userEmail,
    metaJson: {
      broker3MinDemo: true,
      action: input.action,
      stepId: input.stepId ?? null,
      stepIndex: input.stepIndex ?? null,
      ...input.extra,
    },
  });
}
