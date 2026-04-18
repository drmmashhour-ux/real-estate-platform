import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { CommandCenterBoardPack } from "../company-command-center-v6.types";
import {
  boardMetricsFromKpis,
  healthCounts,
  regressionsFromDeltas,
  winsFromDeltas,
} from "../company-command-center-v6-extraction";

export function mapWeeklyBoardPackMode(v4: CompanyCommandCenterV4Payload, _v1: AiControlCenterPayload | null): CommandCenterBoardPack {
  const wins = winsFromDeltas(v4);
  const risks = regressionsFromDeltas(v4);
  const execLines = v4.changesSinceYesterday.executiveSummary.slice(0, 5);

  const rolloutChanges: string[] = [];
  const rs = v4.v3.shared.rolloutSummary;
  rolloutChanges.push(`Primary: ${rs.primarySystems.length ? rs.primarySystems.join(", ") : "—"}`);
  rolloutChanges.push(`Blocked: ${rs.blockedSystems.length ? rs.blockedSystems.join(", ") : "—"}`);

  const notes = [
    ...v4.briefing.cards.slice(0, 4).map((c) => `${c.title}: ${c.summary}`),
    ...execLines.slice(0, 3),
  ];

  const executiveSummary = [
    `Weekly board snapshot — posture ${v4.v3.shared.overallStatus}.`,
    v4.changesSinceYesterday.insufficientBaseline
      ? "Window-over-window compare insufficient for win/risk lists."
      : `Compared: ${v4.meta.currentWindow.label} vs ${v4.meta.previousWindow.label}.`,
  ].join(" ");

  return {
    mode: "weekly_board_pack",
    executiveSummary,
    weeklyWins: wins.length ? wins : ["No clear improvement signals in compared delta fields."],
    weeklyRisks: risks.length ? risks : ["No clear regression signals in compared delta fields."],
    rolloutChanges,
    systemHealthSummary: healthCounts(v4),
    boardMetrics: boardMetricsFromKpis(v4),
    notes: notes.slice(0, 12),
  };
}
