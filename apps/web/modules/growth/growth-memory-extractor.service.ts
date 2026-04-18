/**
 * Extracts bounded memory candidates from read-only growth signals — no persistence.
 */

import type { GrowthMemoryEntry, GrowthMemoryExtractorContext } from "./growth-memory.types";

const NOW = () => new Date().toISOString();

function stableId(category: string, title: string): string {
  let h = 0;
  const key = `${category}:${title.slice(0, 120)}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return `mem-${category}-${Math.abs(h).toString(36)}`;
}

function entry(
  category: GrowthMemoryEntry["category"],
  title: string,
  detail: string,
  source: GrowthMemoryEntry["source"],
  confidence: number,
  tags?: string[],
): GrowthMemoryEntry {
  const t = title.trim().slice(0, 200);
  return {
    id: stableId(category, t),
    category,
    title: t,
    detail: detail.slice(0, 500),
    source,
    confidence: Math.min(0.95, Math.max(0.2, confidence)),
    recurrenceCount: 1,
    lastSeenAt: NOW(),
    tags,
    createdAt: NOW(),
  };
}

/**
 * Derives normalized memory entries from current snapshots. Deterministic; bounded output size per call.
 */
export function extractGrowthMemoryEntries(ctx: GrowthMemoryExtractorContext): GrowthMemoryEntry[] {
  const out: GrowthMemoryEntry[] = [];

  const exec = ctx.executive;
  if (exec) {
    const due = exec.leadSummary.dueNow ?? 0;
    const hot = exec.leadSummary.hotLeads ?? 0;
    if (due >= 3 || (hot >= 5 && due >= 1)) {
      out.push(
        entry(
          "blocker",
          "High-intent and due follow-ups need faster handling",
          `Due-now: ${due}, hot leads: ${hot} — recurring capacity or routing pressure.`,
          "executive",
          0.55,
          ["follow-up", "crm"],
        ),
      );
    }

    if (exec.campaignSummary.adsPerformance === "WEAK") {
      out.push(
        entry(
          "campaign_lesson",
          "Stabilize conversion before scaling paid acquisition",
          "Executive band shows weak paid/landing conversion — memory suggests fixing funnel first.",
          "executive",
          0.62,
          ["cro", "ads"],
        ),
      );
    }

    if (exec.campaignSummary.adsPerformance === "STRONG" && ctx.topUtmCampaign) {
      out.push(
        entry(
          "winning_pattern",
          `Top-attributed campaign continues to anchor lead flow (${ctx.topUtmCampaign})`,
          "Strong band with identifiable UTM leader — reinforce what works before experimenting broadly.",
          "executive",
          0.5,
          ["utm", "campaign"],
        ),
      );
    }

    for (const risk of exec.topRisks.slice(0, 3)) {
      if (!risk?.trim()) continue;
      out.push(
        entry("blocker", risk.slice(0, 160), "Observed on executive risk lines — track until cleared.", "executive", 0.45),
      );
    }
  }

  const gov = ctx.governance;
  if (gov) {
    for (const r of gov.topRisks.slice(0, 4)) {
      out.push(
        entry(
          "governance_lesson",
          r.title,
          r.description || r.reason,
          "governance",
          r.severity === "high" ? 0.7 : 0.5,
          [r.category],
        ),
      );
    }
    if (gov.status === "freeze_recommended" || gov.status === "human_review_required") {
      out.push(
        entry(
          "blocker",
          "Governance requires human review or freeze before expanding automation",
          `Status: ${gov.status}`,
          "governance",
          0.72,
          ["governance"],
        ),
      );
    }
  }

  const strat = ctx.strategyBundle;
  if (strat) {
    for (const b of strat.weeklyPlan.blockers.slice(0, 4)) {
      if (!b?.trim()) continue;
      out.push(entry("blocker", b.slice(0, 160), "From weekly strategy blockers list.", "strategy", 0.48));
    }
    const topP = strat.weeklyPlan.priorities[0];
    if (topP && topP.impact === "high") {
      out.push(
        entry(
          "winning_pattern",
          `Strategy emphasis: ${topP.title.slice(0, 120)}`,
          topP.why.slice(0, 280),
          "strategy",
          0.42 + Math.min(0.2, topP.confidence / 10),
          [topP.theme],
        ),
      );
    }
  }

  const coord = ctx.coordination;
  if (coord?.conflicts?.length) {
    for (const c of coord.conflicts.slice(0, 3)) {
      out.push(
        entry(
          "blocker",
          `Agent conflict: ${c.reason.slice(0, 120)}`,
          "Coordination layer detected overlapping proposals — resolve before execution.",
          "agents",
          c.severity === "high" ? 0.58 : 0.45,
          ["agents"],
        ),
      );
    }
  }

  const sim = ctx.simulationBundle;
  if (sim?.scenarios?.length) {
    const defer = sim.scenarios.filter((s) => s.recommendation === "defer");
    for (const s of defer.slice(0, 2)) {
      out.push(
        entry(
          "campaign_lesson",
          `Simulation suggests deferring: ${s.title}`,
          s.downsideSummary.slice(0, 280),
          "simulation",
          0.4,
          ["simulation"],
        ),
      );
    }
    const consider = sim.scenarios.find((x) => x.recommendation === "consider");
    if (consider) {
      out.push(
        entry(
          "winning_pattern",
          `Simulation “consider” scenario: ${consider.title}`,
          consider.upsideSummary.slice(0, 240),
          "simulation",
          0.38,
          ["simulation"],
        ),
      );
    }
  }

  const rd = ctx.responseDesk;
  if (rd && rd.urgentCount >= 3) {
    out.push(
      entry(
        "followup_lesson",
        "Response Desk shows sustained urgent follow-up load",
        `${rd.urgentCount} urgent items of ${rd.itemCount} — prioritize human review of drafts.`,
        "response_desk",
        0.52,
        ["response_desk"],
      ),
    );
  } else if (rd && rd.urgentCount >= 1 && ctx.leadsToday > 0) {
    out.push(
      entry(
        "followup_lesson",
        "High-intent leads benefit from faster Response Desk review",
        "Urgent items present while new leads are arriving — align capacity.",
        "response_desk",
        0.44,
        ["response_desk"],
      ),
    );
  }

  if (ctx.autopilotRejected >= 2) {
    out.push(
      entry(
        "blocker",
        "Repeated autopilot rejections — align policy with suggested actions",
        `Rejected: ${ctx.autopilotRejected}, pending: ${ctx.autopilotPending}`,
        "autopilot",
        0.55,
        ["autopilot"],
      ),
    );
  }

  if (ctx.autopilotManualOnly >= 4) {
    out.push(
      entry(
        "operator_preference",
        "Many actions remain manual-only — operators may prefer review-heavy mode",
        `Manual-only actions: ${ctx.autopilotManualOnly} — treat as preference signal, not a mandate.`,
        "autopilot",
        0.35,
        ["autopilot", "preference"],
      ),
    );
  }

  if (ctx.adsHealth === "STRONG" && ctx.leadsToday >= 5) {
    out.push(
      entry(
        "winning_pattern",
        "Strong acquisition band with healthy lead volume today",
        "Early-conversion snapshot aligns with strong health — document what is working.",
        "executive",
        0.4,
        ["ads", "volume"],
      ),
    );
  }

  if (ctx.missingDataWarnings.length >= 2) {
    out.push(
      entry(
        "governance_lesson",
        "Partial growth data — treat priorities as directional only",
        ctx.missingDataWarnings.slice(0, 5).join("; "),
        "executive",
        0.33,
        ["data_quality"],
      ),
    );
  }

  const mc = ctx.missionControlDigest;
  if (mc) {
    for (const t of (mc.topRiskTitles ?? []).slice(0, 3)) {
      if (!t?.trim()) continue;
      out.push(
        entry(
          "blocker",
          t.trim().slice(0, 200),
          "Surfaced from Mission Control risk merge (advisory).",
          "mission_control",
          0.48,
          ["mission_control"],
        ),
      );
    }
    for (const t of (mc.humanReviewTitles ?? []).slice(0, 2)) {
      if (!t?.trim()) continue;
      out.push(
        entry(
          "governance_lesson",
          `Review queue signal: ${t.trim().slice(0, 160)}`,
          "From Mission Control human review hints — validate in source workflows.",
          "mission_control",
          0.46,
          ["mission_control", "review"],
        ),
      );
    }
  }

  return out.slice(0, 48);
}
