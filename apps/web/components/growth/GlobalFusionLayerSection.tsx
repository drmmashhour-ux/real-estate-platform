import { globalFusionFlags } from "@/config/feature-flags";
import { getGlobalFusionMonitoringSnapshot } from "@/modules/global-fusion/global-fusion-monitoring.service";
import {
  getGlobalFusionLearningHealthSnapshot,
  getLastLearningSummary,
} from "@/modules/global-fusion/global-fusion-learning-monitoring.service";
import { getGlobalFusionFreezeState } from "@/modules/global-fusion/global-fusion-freeze.service";
import {
  getGovernanceMonitoringSummary,
  getLastGovernanceSnapshot,
} from "@/modules/global-fusion/global-fusion-governance-monitoring.service";
import { buildGlobalFusionPrimarySurface } from "@/modules/global-fusion/global-fusion-primary.service";
import { buildGlobalFusionExecutiveSummary } from "@/modules/global-fusion/global-fusion-executive.service";
import { buildGlobalFusionOperatingProtocol } from "@/modules/global-fusion/global-fusion-protocol.service";

/** Compact Global Fusion V1 block — read-only advisory; additive to Fusion System V1. */
export async function GlobalFusionLayerSection() {
  if (!globalFusionFlags.globalFusionV1) {
    return null;
  }

  const primary = await buildGlobalFusionPrimarySurface({ days: 7, limit: 10 }).catch(() => null);
  const executiveEnabled =
    globalFusionFlags.globalFusionExecutiveLayerV1 || globalFusionFlags.globalFusionExecutiveFeedV1;
  const executive = executiveEnabled
    ? await buildGlobalFusionExecutiveSummary({ primary }).catch(() => null)
    : null;
  const protocolEnabled =
    globalFusionFlags.globalFusionProtocolV1 || globalFusionFlags.globalFusionProtocolFeedV1;
  const protocolBundle = protocolEnabled
    ? await buildGlobalFusionOperatingProtocol({ primary }).catch(() => null)
    : null;
  const payload = primary?.fusionPayload;
  if (!payload?.enabled || !payload.snapshot) {
    return (
      <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/20 px-3 py-2 text-[11px] text-zinc-500">
        <span className="font-semibold text-slate-400/90">Global Fusion V1</span> · payload unavailable
      </div>
    );
  }

  const s = payload.snapshot;
  const m = payload.meta;
  const mon = getGlobalFusionMonitoringSnapshot();
  const learnHealth = globalFusionFlags.globalFusionLearningV1 ? getGlobalFusionLearningHealthSnapshot() : null;
  const learnLast = globalFusionFlags.globalFusionLearningV1 ? getLastLearningSummary() : null;
  const govSnap = globalFusionFlags.globalFusionGovernanceV1 ? getLastGovernanceSnapshot() : null;
  const govMon = globalFusionFlags.globalFusionGovernanceV1 ? getGovernanceMonitoringSummary() : null;
  const freeze = getGlobalFusionFreezeState();
  const showGov =
    globalFusionFlags.globalFusionGovernanceV1 || freeze.learningFrozen || freeze.influenceFrozen;

  return (
    <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/20 px-3 py-2 text-[11px] text-zinc-400">
      <span className="font-semibold text-slate-300/90">Global Fusion V1</span> · systems {m.contributingSystemsCount} ·
      signals {m.normalizedSignalCount} · conflicts {m.conflictCount} · recommendations {m.recommendationCount}
      <span className="text-zinc-600">
        {" "}
        · agreement ~{(s.scores.agreementScore * 100).toFixed(0)}% · missing sources {m.missingSources.length}
      </span>
      <span className="text-zinc-600">
        {" "}
        · influence flag {m.influenceFlag ? "on" : "off"} · primary flag {m.primaryFlag ? "on" : "off"}
      </span>
      {s.opportunities.length > 0 ? (
        <div className="mt-1 text-zinc-500">
          Top opportunities:{" "}
          {s.opportunities.slice(0, 2).map((o) => (
            <span key={o.id} className="mr-2 text-zinc-400">
              {o.title}
            </span>
          ))}
        </div>
      ) : null}
      {s.risks.length > 0 ? (
        <div className="mt-0.5 text-amber-200/70">
          Risks: {s.risks.slice(0, 2).map((r) => r.title).join(" · ")}
        </div>
      ) : null}
      {payload.health.observationalWarnings.length > 0 ? (
        <div className="mt-1 text-[10px] text-zinc-600">{payload.health.observationalWarnings[0]}</div>
      ) : null}
      {m.influenceFlag && s.influence ? (
        <div className="mt-1.5 border-t border-slate-800/60 pt-1.5 text-[10px] text-zinc-500">
          <span className="font-medium text-zinc-400">Fusion influence (Phase B)</span> · applied{" "}
          {s.influence.applied && !s.influence.skipped ? "yes" : "no"} · skipped {s.influence.skipped ? "yes" : "no"} · gate{" "}
          {s.influence.gate.tier} · boosted {s.influence.metrics.boostedCount} · caution {s.influence.metrics.cautionCount} ·
          defer {s.influence.metrics.deferredCount} · monitor {s.influence.metrics.monitorCount} · human review{" "}
          {s.influence.metrics.humanReviewCount}
          {s.influence.reasons[0] ? (
            <span className="block truncate text-zinc-600" title={s.influence.reasons[0].detail}>
              {s.influence.reasons[0].code}: {s.influence.reasons[0].detail}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1.5 border-t border-slate-800/60 pt-1.5 text-[10px] text-zinc-600">
        <span className="font-medium text-zinc-400">Fusion monitoring (Phase D)</span> · runs {mon.runsTotal} · fallback rate{" "}
        {(mon.fallbackRate * 100).toFixed(0)}% · missing src rate {(mon.missingSourceRate * 100).toFixed(0)}% · conflict rate{" "}
        {(mon.conflictRate * 100).toFixed(0)}% · anomalies {mon.counters.anomalyRuns}
      </div>
      {learnHealth ? (
        <div className="mt-1 text-[10px] text-zinc-600">
          <span className="font-medium text-zinc-400">Fusion learning (Phase E)</span> · cycles {learnHealth.learningRuns} · drift L1{" "}
          {learnHealth.weightDriftL1.toFixed(3)} · hit rate{" "}
          {learnLast?.recommendationHitRate != null ? `${(learnLast.recommendationHitRate * 100).toFixed(0)}%` : "—"} · adaptive{" "}
          {globalFusionFlags.globalFusionLearningAdaptiveWeightsV1 ? "on" : "off"}
        </div>
      ) : null}
      {showGov ? (
        <div className="mt-1 text-[10px] text-zinc-600">
          <span className="font-medium text-zinc-400">Fusion governance (Phase F)</span> · decision{" "}
          {govSnap?.status.decision ?? "—"} · evals {govMon?.evaluationsCount ?? 0} · rollback recs{" "}
          {govMon?.rollbackRecommendationsCount ?? 0} · freeze L/I {freeze.learningFrozen ? "Y" : "N"}/
          {freeze.influenceFrozen ? "Y" : "N"}
        </div>
      ) : null}
      {executive ? (
        <div className="mt-1 text-[10px] text-zinc-600">
          <span className="font-medium text-zinc-400">Fusion executive (Phase G)</span> · layer{" "}
          {globalFusionFlags.globalFusionExecutiveLayerV1 ? "on" : "off"} · feed{" "}
          {globalFusionFlags.globalFusionExecutiveFeedV1 ? "on" : "off"} · overall {executive.overallStatus} · readiness{" "}
          {executive.companyReadiness.label} · priorities {executive.topPriorities.length} · risks {executive.topRisks.length}{" "}
          · blockers {executive.topBlockers.length}
          {executive.provenance.generatedAt ? (
            <span className="text-zinc-600"> · {new Date(executive.provenance.generatedAt).toISOString().slice(11, 19)}Z</span>
          ) : null}
        </div>
      ) : null}
      {protocolBundle ? (
        <div className="mt-1 text-[10px] text-zinc-600">
          <span className="font-medium text-zinc-400">Fusion protocol (Phase H)</span> · protocol{" "}
          {globalFusionFlags.globalFusionProtocolV1 ? "on" : "off"} · feed{" "}
          {globalFusionFlags.globalFusionProtocolFeedV1 ? "on" : "off"} ·{" "}
          {protocolBundle.protocol.active ? "active" : "inactive"} · signals {protocolBundle.protocol.signals.length} ·
          directives {protocolBundle.protocol.directives.length} · conflicts {protocolBundle.protocol.conflicts.length}
        </div>
      ) : null}
      {globalFusionFlags.globalFusionPrimaryV1 && primary ? (
        <div className="mt-1.5 border-t border-slate-800/60 pt-1.5 text-[10px] text-zinc-500">
          <span className="font-medium text-zinc-400">Fusion primary (Phase C)</span> · path {primary.path} · active{" "}
          {primary.primarySurfaceActive ? "yes" : "no"}
          {primary.surface ? (
            <span className="text-zinc-600">
              {" "}
              · top bucket counts proceed {primary.surface.groupedBy.proceed.length} · caution{" "}
              {primary.surface.groupedBy.proceed_with_caution.length} · monitor {primary.surface.groupedBy.monitor_only.length}{" "}
              · review {primary.surface.groupedBy.require_human_review.length}
            </span>
          ) : null}
          {!primary.primarySurfaceActive && primary.validation.reasons[0] ? (
            <span className="block truncate text-amber-200/60" title={primary.validation.reasons.join(", ")}>
              fallback: {primary.validation.reasons[0]}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
