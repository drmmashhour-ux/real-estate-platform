import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { MorningBriefModeView } from "../company-command-center-v5.types";
import { keySystemsNeedingAttention } from "../company-command-center-v5-extraction";

export function mapMorningBriefMode(v4: CompanyCommandCenterV4Payload): MorningBriefModeView {
  const founder = v4.v3.roles.founder;
  const exec = v4.changesSinceYesterday.executiveSummary.slice(0, 5);
  const topChanges = v4.changesSinceYesterday.insufficientBaseline
    ? ["Insufficient baseline for window-over-window compare."]
    : exec.slice(0, 3);

  const topRisks = founder.topRisks.slice(0, 3).map((r) => r.label);
  const topOpportunities = founder.topPriorities.slice(0, 3).map((p) => p.label);

  const todayFocus: string[] = [];
  for (const c of v4.briefing.cards.slice(0, 4)) {
    todayFocus.push(c.title);
  }
  for (const it of v4.anomalyDigest.items.slice(0, 2)) {
    todayFocus.push(`${it.system}: ${it.title}`);
  }

  const heroSummary = [
    `Posture ${v4.v3.shared.overallStatus}.`,
    v4.changesSinceYesterday.insufficientBaseline
      ? ""
      : `Compared windows: ${v4.meta.currentWindow.label} vs ${v4.meta.previousWindow.label}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    mode: "morning_brief",
    heroSummary,
    topChanges,
    topRisks: topRisks.length ? topRisks : ["—"],
    topOpportunities: topOpportunities.length ? topOpportunities : ["—"],
    keySystems: keySystemsNeedingAttention(v4),
    todayFocus: todayFocus.slice(0, 8),
    warnings: [...v4.v3.roles.founder.warnings.slice(0, 8), ...v4.v3.shared.meta.missingSources.map((m) => `Missing source: ${m}`)].slice(
      0,
      12,
    ),
  };
}
