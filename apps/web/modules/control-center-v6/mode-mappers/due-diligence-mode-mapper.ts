import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { CommandCenterDueDiligenceSummary } from "../company-command-center-v6.types";
import { evidenceFromMeta } from "../company-command-center-v6-extraction";

export function mapDueDiligenceMode(v4: CompanyCommandCenterV4Payload, v1: AiControlCenterPayload | null): CommandCenterDueDiligenceSummary {
  const s = v4.v3.shared.systems;
  const moatSignals: string[] = [];
  const governanceSignals: string[] = [];
  const maturitySignals: string[] = [];
  const riskSignals: string[] = [];
  const openQuestions: string[] = [];
  const evidenceNotes = evidenceFromMeta(v4, v1);

  if (s) {
    maturitySignals.push(`Aggregate reports ${v4.v3.shared.meta.systemsLoadedCount} subsystems in this snapshot.`);
    if (s.fusion.orchestrationActive) maturitySignals.push("Fusion orchestration flag is active in snapshot.");
    if (s.brain.shadowObservationEnabled || s.brain.influenceEnabled || s.brain.primaryEnabled) {
      moatSignals.push("Brain V8 exposes shadow/influence/primary toggles in governance snapshot.");
    }
    governanceSignals.push(`Executive posture: ${v4.v3.shared.overallStatus}`);
    if (v4.v3.shared.meta.partialData) governanceSignals.push("Partial data: some upstream sources missing (see meta).");
    if (s.ranking.rollbackAny) riskSignals.push("Ranking rollback signal present in snapshot.");
    if ((s.platformCore.overdueSchedules ?? 0) > 0) riskSignals.push(`Platform overdue schedules reported: ${s.platformCore.overdueSchedules}`);
  } else {
    openQuestions.push("Subsystem matrix unavailable — diligence coverage incomplete.");
  }
  if (v4.v3.shared.meta.missingSources.length) {
    openQuestions.push(`Missing upstream sources (names): ${v4.v3.shared.meta.missingSources.slice(0, 5).join(", ")}`);
  }

  const diligenceSummary = [
    "Diligence view uses only fields present in the governance aggregate.",
    `Observed overall status: ${v4.v3.shared.overallStatus}.`,
  ].join(" ");

  return {
    mode: "due_diligence",
    diligenceSummary,
    moatSignals: moatSignals.slice(0, 8),
    governanceSignals: governanceSignals.slice(0, 8),
    maturitySignals: maturitySignals.slice(0, 8),
    riskSignals: riskSignals.slice(0, 8),
    openQuestions: openQuestions.slice(0, 8),
    evidenceNotes: evidenceNotes.slice(0, 10),
  };
}
