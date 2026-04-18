import type { EvaluateGrowthPoliciesContext, GrowthPolicyResult } from "./growth-policy.types";
import { recordGrowthPolicyEvaluation } from "./growth-policy-monitoring.service";

const MAX_RESULTS = 12;

function severityOrder(s: GrowthPolicyResult["severity"]): number {
  if (s === "critical") return 0;
  if (s === "warning") return 1;
  return 2;
}

/** Dedupe by domain + normalized title (overlapping rules). */
function dedupePolicies(results: GrowthPolicyResult[]): GrowthPolicyResult[] {
  const seen = new Set<string>();
  const out: GrowthPolicyResult[] = [];
  for (const r of results) {
    const key = `${r.domain}:${r.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function adsLeads(m: NonNullable<EvaluateGrowthPoliciesContext["adsMetrics"]>): number | undefined {
  if (m.leads !== undefined) return m.leads;
  return undefined;
}

/**
 * Deterministic, bounded policy evaluation — advisory only; does not block execution.
 */
export function evaluateGrowthPolicies(context: EvaluateGrowthPoliciesContext): GrowthPolicyResult[] {
  const raw: GrowthPolicyResult[] = [];

  const push = (r: GrowthPolicyResult) => {
    raw.push(r);
  };

  const gov = context.governanceDecision;
  const status = gov?.status?.toLowerCase().trim();

  if (status === "freeze_recommended") {
    push({
      id: "policy-governance-freeze-status",
      domain: "governance",
      severity: "critical",
      title: "Freeze recommended for growth expansion",
      description:
        "Governance indicates a freeze posture — expansion and automated promotion should be treated as high risk until reviewed.",
      recommendation:
        "Freeze risky growth expansion and review weak signals before proceeding — advisory only in V1 (no runtime block).",
    });
  }
  if (status === "human_review_required") {
    push({
      id: "policy-governance-human-review-status",
      domain: "governance",
      severity: "critical",
      title: "Human review required before promoting growth actions",
      description: "At least one governance signal requires explicit operator review.",
      recommendation: "Escalate to operator review before promoting more actions — confirm in your governance checklist.",
    });
  }

  const ads = context.adsMetrics;
  if (ads) {
    const imp = ads.impressions;
    const leadCount = adsLeads(ads);
    if (
      imp !== undefined &&
      imp > 0 &&
      leadCount !== undefined &&
      leadCount === 0
    ) {
      push({
        id: "policy-ads-zero-leads",
        domain: "ads",
        severity: "warning",
        title: "Ads are generating activity but no leads",
        description:
          "Impressions are present in-window but recorded lead count is zero — verify tracking, offer clarity, and landing alignment.",
        recommendation:
          "Review targeting, offer clarity, and landing-page conversion before increasing spend — manual changes only.",
      });
    }

    const conv = ads.conversionRate;
    const clicks = ads.clicks;
    if (
      imp !== undefined &&
      imp >= 100 &&
      clicks !== undefined &&
      clicks >= 20 &&
      conv !== undefined &&
      Number.isFinite(conv) &&
      conv < 0.02
    ) {
      push({
        id: "policy-ads-low-conversion-rate",
        domain: "ads",
        severity: "warning",
        title: "High ad activity with low conversion rate",
        description:
          "Aggregate conversion rate is below a conservative floor given activity levels — scaling may waste budget.",
        recommendation: "Pause scaling and fix conversion before pushing more traffic — advisory only.",
      });
    }
  }

  const lm = context.leadMetrics;
  if (lm) {
    const viewed = lm.viewed;
    const unlocked = lm.unlocked;
    if (viewed !== undefined && viewed > 0 && unlocked !== undefined && unlocked === 0) {
      push({
        id: "policy-leads-view-no-unlock",
        domain: "leads",
        severity: "warning",
        title: "Leads viewed but none unlocked",
        description:
          "Leads are being surfaced but paid unlocks are not following — pricing, preview quality, or trust may be misaligned.",
        recommendation: "Review lead pricing, preview quality, and broker conversion messaging — no automatic price changes.",
      });
    }

    const fq = lm.followUpQueue;
    const responded = lm.responded;
    if (
      unlocked !== undefined &&
      unlocked >= 10 &&
      fq !== undefined &&
      fq >= 8 &&
      responded !== undefined &&
      responded / Math.max(1, fq) < 0.25
    ) {
      push({
        id: "policy-leads-followup-critical",
        domain: "leads",
        severity: "critical",
        title: "Lead volume with weak follow-up throughput",
        description:
          "Unlocked lead volume is meaningful but follow-up queue completion is weak — pipeline and reputation risk.",
        recommendation:
          "Improve broker follow-up speed before increasing lead volume — confirm capacity in CRM; advisory only.",
      });
    }
  }

  const mm = context.messagingMetrics;
  if (mm) {
    const q = mm.queued;
    const rr = mm.responseRate;
    if (q !== undefined && q >= 10 && rr !== undefined && Number.isFinite(rr) && rr < 0.3) {
      push({
        id: "policy-messaging-queue-response",
        domain: "messaging",
        severity: "warning",
        title: "High follow-up queue with low response rate",
        description: "Queued follow-ups are elevated but response rate is below a conservative threshold.",
        recommendation: "Prioritize response speed and follow-up consistency — no auto-send in this layer.",
      });
    }
  }

  const bm = context.brokerMetrics;
  if (bm) {
    const active = bm.activeBrokers;
    const avgClose = bm.avgCloseRate;
    if (
      active !== undefined &&
      active > 0 &&
      avgClose !== undefined &&
      Number.isFinite(avgClose) &&
      avgClose < 0.1
    ) {
      push({
        id: "policy-broker-weak-close",
        domain: "broker",
        severity: "warning",
        title: "Active brokers but weak close-rate signal",
        description: "Average close-rate proxy from available data is low relative to active brokers.",
        recommendation: "Prioritize higher-performing brokers and improve broker coaching — routing remains manual.",
      });
    }
    const slow = bm.slowResponseBrokerCount;
    if (
      active !== undefined &&
      active > 0 &&
      slow !== undefined &&
      slow / Math.max(1, active) > 0.5
    ) {
      push({
        id: "policy-broker-slow-dominance",
        domain: "broker",
        severity: "warning",
        title: "Slow-response brokers dominate handling",
        description: "A large share of brokers show slow-response signals vs active brokers.",
        recommendation: "Reduce reliance on slow responders and push faster brokers first when operationally possible.",
      });
    }
  }

  const pm = context.pricingMetrics;
  if (pm) {
    if (pm.unstableSignals === true) {
      push({
        id: "policy-pricing-unstable-flag",
        domain: "pricing",
        severity: "warning",
        title: "Pricing signals unstable",
        description: "Instability flags are set on pricing intelligence — discretionary changes are higher risk.",
        recommendation: "Keep pricing conservative until signal quality improves — no automatic price writes.",
      });
    } else {
      const vol = pm.volatilityScore;
      if (vol !== undefined && Number.isFinite(vol) && vol > 0.35) {
        push({
          id: "policy-pricing-volatility",
          domain: "pricing",
          severity: "warning",
          title: "Pricing volatility elevated",
          description: "Volatility score exceeds a conservative bound — experiments should be smaller and reviewed.",
          recommendation: "Keep pricing conservative until signal quality improves.",
        });
      }
    }
  }

  const cm = context.contentMetrics;
  if (cm) {
    const gen = cm.generatedCount;
    const eng = cm.engagementCount;
    if (gen !== undefined && gen > 0 && (eng === undefined || eng < 2)) {
      push({
        id: "policy-content-weak-engagement",
        domain: "content",
        severity: "info",
        title: "Content output without meaningful engagement",
        description:
          "Generated content volume is non-zero but engagement signals are absent or very weak in-window.",
        recommendation: "Refine content angle and distribution before scaling content output.",
      });
    }
  }

  const cro = context.croMetrics;
  if (cro) {
    const v = cro.visits;
    const c = cro.conversions;
    if (v !== undefined && v >= 200 && c !== undefined && c / Math.max(1, v) < 0.01) {
      push({
        id: "policy-cro-low-conversion",
        domain: "cro",
        severity: "warning",
        title: "CRO traffic with very low conversion",
        description: "Visit volume is meaningful but conversion vs visits is below a conservative floor.",
        recommendation:
          "Run a structured CRO review (forms, speed, trust) — does not auto-change experiments or live pages.",
      });
    }
  }

  const deduped = dedupePolicies(raw);
  const sorted = deduped.sort((a, b) => {
    const s = severityOrder(a.severity) - severityOrder(b.severity);
    if (s !== 0) return s;
    return a.id.localeCompare(b.id);
  });

  const capped = sorted.slice(0, MAX_RESULTS);

  try {
    recordGrowthPolicyEvaluation(capped);
  } catch {
    /* monitoring must never break evaluation */
  }

  return capped;
}
