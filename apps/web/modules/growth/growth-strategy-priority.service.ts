/**
 * Maps coordinated signals into at most 5 weekly priorities — advisory only.
 */

import type {
  GrowthStrategyPriority,
  GrowthStrategySourceSnapshot,
  GrowthStrategyTheme,
} from "./growth-strategy.types";

const MAX_PRIORITIES = 5;

function slugId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function inferTheme(text: string): GrowthStrategyTheme {
  const t = text.toLowerCase();
  if (/govern|compliance|policy|risk|freeze|review/i.test(t)) return "governance";
  if (/lead|follow|reply|outreach|contact|crm/i.test(t)) return "lead_followup";
  if (/content|copy|blog|seo|landing copy/i.test(t)) return "content";
  if (/campaign|ad|traffic|acquisition|utm|source/i.test(t)) return "acquisition";
  if (/convert|cro|cta|form|checkout|funnel/i.test(t)) return "conversion";
  if (/autopilot|execute|workflow|pipeline/i.test(t)) return "execution";
  if (/experiment|test|variant/i.test(t)) return "experimentation";
  return "execution";
}

function clampConfidence(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

export function buildGrowthStrategyPriorities(
  input: GrowthStrategySourceSnapshot,
): GrowthStrategyPriority[] {
  const candidates: Omit<GrowthStrategyPriority, "id">[] = [];

  const exec = input.executive;
  if (exec?.topPriorities?.length) {
    for (const p of exec.topPriorities.slice(0, 3)) {
      const title = p.title;
      const theme = inferTheme(title + " " + (p.why ?? ""));
      candidates.push({
        title,
        theme,
        impact: p.impact ?? (exec.status === "weak" ? "high" : "medium"),
        confidence: clampConfidence(p.confidence ?? (exec.status === "strong" ? 0.78 : 0.7)),
        why: p.why || "From executive summary priorities.",
      });
    }
  }

  const coord = input.coordination;
  const coordList = coord?.topPriorities?.length ? coord.topPriorities : coord?.proposals ?? [];
  if (coordList.length) {
    for (const prop of coordList.slice(0, 3)) {
      const title = prop.title?.trim() || "Coordinated action";
      candidates.push({
        title,
        theme: inferTheme(`${title} ${prop.rationale ?? ""}`),
        impact: prop.impact ?? "medium",
        confidence: clampConfidence(prop.confidence ?? 0.65),
        why: prop.rationale ? `Coordination: ${prop.rationale}` : "From multi-agent coordination.",
      });
    }
  }

  const brief = input.dailyBrief;
  if (brief?.today?.priorities?.length) {
    for (const line of brief.today.priorities.slice(0, 3)) {
      candidates.push({
        title: line,
        theme: inferTheme(line),
        impact: "medium",
        confidence: 0.6,
        why: "From daily brief today priorities.",
      });
    }
  }

  const fusion = input.fusionSummary;
  if (fusion?.topActions?.length) {
    for (const a of fusion.topActions.slice(0, 2)) {
      candidates.push({
        title: a,
        theme: inferTheme(a),
        impact: fusion.status === "weak" ? "high" : "medium",
        confidence: clampConfidence(fusion.confidence ?? 0.55),
        why: "From fusion top actions.",
      });
    }
  }

  if (input.governance?.recommendedAction && input.governance.riskLevel !== "low") {
    candidates.push({
      title: `Governance: ${input.governance.recommendedAction}`,
      theme: "governance",
      impact: input.governance.riskLevel === "high" ? "high" : "medium",
      confidence: 0.75,
      why: "Governance layer recommendation.",
      blockers: input.governance.blockers?.length ? [...input.governance.blockers] : undefined,
    });
  }

  if (input.hotLeadCount > 0 && input.dueNowCount > 2) {
    candidates.push({
      title: "Follow up high-intent leads before scaling traffic",
      theme: "lead_followup",
      impact: "high",
      confidence: 0.72,
      why: `Hot leads (${input.hotLeadCount}) and due follow-ups (${input.dueNowCount}) indicate response load.`,
    });
  }

  if (input.adsHealth === "WEAK" && input.executive?.campaignSummary.adsPerformance === "WEAK") {
    candidates.push({
      title: "Review acquisition efficiency before increasing spend",
      theme: "acquisition",
      impact: "high",
      confidence: 0.68,
      why: "Ads health reads weak in executive and snapshot.",
    });
  }

  for (const ap of input.autopilotTopActions.slice(0, 2)) {
    candidates.push({
      title: ap.title,
      theme: "execution",
      impact: ap.impact,
      confidence: clampConfidence(0.55 + ap.priorityScore * 0.01),
      why: "From autopilot suggested actions (review manually; not auto-executed).",
    });
  }

  const seen = new Set<string>();
  const deduped: typeof candidates = [];
  for (const c of candidates) {
    const key = c.title.toLowerCase().slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(c);
  }

  deduped.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const ia = impactOrder[a.impact];
    const ib = impactOrder[b.impact];
    if (ib !== ia) return ib - ia;
    return b.confidence - a.confidence;
  });

  if (deduped.length === 0) {
    deduped.push({
      title: "Review growth signals when more data is available",
      theme: "governance",
      impact: "medium",
      confidence: 0.45,
      why: "Partial snapshot — no ranked priorities from upstream layers yet.",
    });
  }

  return deduped.slice(0, MAX_PRIORITIES).map((c, i) => ({
    ...c,
    id: slugId("prio", i),
  }));
}
