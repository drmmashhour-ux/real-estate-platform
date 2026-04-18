/**
 * Revenue automation cycle — analyze → detect leaks → actions → triggers (no payments).
 */

import { getMosMarketRuntime } from "@/config/country";
import { revenueAutomationFlags } from "@/config/feature-flags";
import type {
  AutomationActionItem,
  AutomationCycleMode,
  AutomationCycleResult,
  AutomationKind,
  AutomationTriggerId,
} from "./revenue-automation.types";
import type { MoneyOperatingSystemSnapshot } from "./money-os.types";
import { assistedBundleForLeakTitle } from "./revenue-automation-assisted.service";
import {
  evaluateAutomationTriggers,
  type TriggerEvaluation,
} from "./revenue-automation-triggers.service";
import {
  getMaxAutomationActionsPerRun,
  isRevenueAutomationKillSwitchActive,
} from "./revenue-automation-safety";

function combinedScore(impact: number, urgency: number): number {
  return Math.round(impact * 0.55 + urgency * 0.45);
}

function pickKind(
  index: number,
  hasAssisted: boolean,
  triggersFired: AutomationTriggerId[],
): AutomationKind {
  if (hasAssisted) return "assisted";
  if (index === 0 && triggersFired.length > 0) return "auto_trigger_safe";
  return "suggestion";
}

function explainAction(
  index: number,
  trig: TriggerEvaluation[],
  fallback: string,
): string {
  const fired = trig.filter((t) => t.fired);
  if (fired.length === 0) return fallback;
  if (index === 0) return fired.map((t) => `${t.id}: ${t.reason}`).join(" ");
  return `${fallback} Context: ${fired[0]?.reason ?? ""}`.trim();
}

function buildItems(
  snapshot: MoneyOperatingSystemSnapshot,
  trig: TriggerEvaluation[],
  fired: AutomationTriggerId[],
): AutomationActionItem[] {
  const cap = getMaxAutomationActionsPerRun();
  const country = getMosMarketRuntime();
  const items: AutomationActionItem[] = [];

  const ranked = snapshot.rankedProblems;

  for (let i = 0; i < snapshot.actions.length && items.length < cap; i++) {
    const a = snapshot.actions[i]!;
    const rp = ranked.find((r, j) => j === i) ?? ranked[0];
    const impact = rp?.impactScore ?? 72;
    const urgency = fired.length > 0 ? 90 : 58;
    const assisted =
      country.allowedSafeAutomations.includes("broker_outreach_draft") ||
      country.allowedSafeAutomations.includes("pricing_advisory_copy")
        ? assistedBundleForLeakTitle(rp?.title ?? a.text, snapshot, country)
        : undefined;
    const hasAssisted = !!(assisted && (assisted.copyBlock || assisted.brokerOutreachDraft));
    const kind = pickKind(i, !!hasAssisted, fired);

    items.push({
      id: `${a.id}-auto`,
      kind,
      title: a.text,
      explanation: explainAction(i, trig, a.rationale),
      triggerRefs: fired.length ? fired : [],
      impactScore: impact,
      urgencyScore: urgency,
      combinedScore: combinedScore(impact, urgency),
      assisted: hasAssisted ? assisted : undefined,
    });
  }

  return items
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, cap);
}

export async function runRevenueAutomationCycle(options: {
  mode: AutomationCycleMode;
  snapshot: MoneyOperatingSystemSnapshot;
}): Promise<AutomationCycleResult> {
  const ranAt = new Date().toISOString();
  const country = getMosMarketRuntime();
  const kill = isRevenueAutomationKillSwitchActive();
  const automationFlagOn = revenueAutomationFlags.revenueAutomationV1;

  const emptyBase = (): AutomationCycleResult => ({
    ranAt,
    mode: options.mode,
    skipped: true,
    skipReason: undefined,
    triggersFired: [],
    actions: [],
    maxActionsCap: getMaxAutomationActionsPerRun(),
    countryCode: country.countryCode,
    currency: country.currency,
    safety: { killSwitchActive: kill, automationFlagOn },
  });

  if (kill) {
    return { ...emptyBase(), skipReason: "FEATURE_AUTOMATION_KILL_SWITCH active" };
  }

  if (!automationFlagOn) {
    return { ...emptyBase(), skipReason: "FEATURE_REVENUE_AUTOMATION_V1 off" };
  }

  const trig = evaluateAutomationTriggers(options.snapshot);
  const fired = trig.filter((t) => t.fired).map((t) => t.id);

  let actions = buildItems(options.snapshot, trig, fired);

  if (options.mode === "light") {
    actions = actions.slice(0, Math.min(5, actions.length));
  }

  if (process.env.NODE_ENV !== "production" || process.env.REVENUE_AUTOMATION_LOG === "1") {
    console.info("[revenue:automation]", {
      mode: options.mode,
      country: country.countryCode,
      fired,
      actionCount: actions.length,
    });
  }

  return {
    ranAt,
    mode: options.mode,
    skipped: false,
    triggersFired: fired,
    actions,
    maxActionsCap: getMaxAutomationActionsPerRun(),
    countryCode: country.countryCode,
    currency: country.currency,
    safety: { killSwitchActive: false, automationFlagOn: true },
  };
}
