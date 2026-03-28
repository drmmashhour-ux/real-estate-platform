/**
 * Ops playbook: interpret the five funnel metrics and suggest a primary bottleneck.
 * Rates are decimals (e.g. 0.25 = 25%). Use only open conversations as denominator.
 */

export type MetricHealth = "weak" | "ok" | "strong";

export type FiveRates = {
  replyRate: number;
  highIntentRate: number;
  conversionRate: number;
  handoffRate: number;
  staleRate: number;
};

export type GrowthAiBottleneck =
  | {
      case: "A" | "B" | "C" | "D" | "E";
      title: string;
      problem: string;
      fix: string;
    }
  | { case: null; title: string; problem: string; fix: string };

const MIN_N = 8;

export function replyRateHealth(rate: number): { health: MetricHealth; hint: string } {
  if (rate < 0.2)
    return { health: "weak", hint: "<20% engaged ÷ total (replied+qualified+call_scheduled+booked)" };
  if (rate < 0.4) return { health: "ok", hint: "20–40% → normal" };
  return { health: "strong", hint: "≥40% → strong" };
}

export function highIntentRateHealth(rate: number): { health: MetricHealth; hint: string } {
  if (rate < 0.15) return { health: "weak", hint: "<15% → targeting or weak CTA" };
  if (rate < 0.3) return { health: "ok", hint: "15–30% → good" };
  return { health: "strong", hint: "≥30% → strong demand" };
}

export function conversionRateHealth(rate: number): { health: MetricHealth; hint: string } {
  if (rate < 0.03) return { health: "weak", hint: "<3% → friction or trust" };
  if (rate < 0.1) return { health: "ok", hint: "3–8% → normal" };
  return { health: "strong", hint: "≥10% → very strong" };
}

/** High handoff = automation bailing too often. */
export function handoffRateHealth(rate: number): { health: MetricHealth; hint: string } {
  if (rate >= 0.2) return { health: "weak", hint: "≥20% → automation too weak / over-escalation" };
  if (rate < 0.05) return { health: "strong", hint: "<5% → good" };
  return { health: "ok", hint: "5–20% → watch" };
}

export function staleRateHealth(rate: number): { health: MetricHealth; hint: string } {
  if (rate >= 0.5) return { health: "weak", hint: "≥50% → urgency / follow-up issue" };
  if (rate < 0.3) return { health: "strong", hint: "<30% → good" };
  return { health: "ok", hint: "30–50% → tighten nudges" };
}

export function inferPrimaryBottleneck(
  total: number,
  rates: FiveRates
): GrowthAiBottleneck {
  if (total < MIN_N) {
    return {
      case: null,
      title: "Need more data",
      problem: `Fewer than ${MIN_N} open conversations — bands are noisy.`,
      fix: "Let the inbox accumulate, then re-check these five metrics.",
    };
  }

  const { replyRate, highIntentRate, conversionRate, handoffRate, staleRate } = rates;

  if (replyRate < 0.2) {
    return {
      case: "A",
      title: "CASE A — Low reply rate",
      problem: "Messages are not triggering replies.",
      fix: "Lead with a simple question (e.g. what they are looking for: live, invest, or browsing). Questions drive replies.",
    };
  }

  if (staleRate >= 0.5) {
    return {
      case: "C",
      title: "CASE C — High stale rate",
      problem: "Threads die without urgency.",
      fix: "Nudge with realistic scarcity (e.g. this type of listing usually moves) + clear offer to secure or see similar options.",
    };
  }

  if (handoffRate >= 0.2) {
    return {
      case: "E",
      title: "CASE E — High handoff rate",
      problem: "Automation escalates before clarifying.",
      fix: "Tighten templates, add one clarification question before handoff where safe; reduce low-confidence handoffs.",
    };
  }

  if (highIntentRate < 0.15) {
    return {
      case: "D",
      title: "CASE D — Low high-intent rate",
      problem: "Weak triggers or CTAs upstream.",
      fix: "Classifier: treat how much, details, availability, visit asks, and timing questions as high-intent; strengthen openers and next-step CTAs.",
    };
  }

  if (replyRate >= 0.2 && conversionRate < 0.03) {
    return {
      case: "B",
      title: "CASE B — Replies without conversion",
      problem: "Trust or checkout friction after engagement.",
      fix: "State verification + secure payments early; push one clear action (complete the request now so you do not lose it).",
    };
  }

  return {
    case: null,
    title: "No single red flag",
    problem: "No playbook case dominates — scan threads for missing next steps.",
    fix: "Gold rule: every AI turn should end with one clear action (question or step).",
  };
}

export function buildFiveMetricReport(total: number, rates: FiveRates) {
  return {
    rates,
    reply: replyRateHealth(rates.replyRate),
    highIntent: highIntentRateHealth(rates.highIntentRate),
    conversion: conversionRateHealth(rates.conversionRate),
    handoff: handoffRateHealth(rates.handoffRate),
    stale: staleRateHealth(rates.staleRate),
    bottleneck: inferPrimaryBottleneck(total, rates),
  };
}
