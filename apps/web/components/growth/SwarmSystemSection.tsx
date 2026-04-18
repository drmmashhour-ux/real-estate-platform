import { swarmSystemFlags } from "@/config/feature-flags";
import { runSwarmCycle } from "@/modules/swarm/swarm-orchestrator.service";

/** Compact swarm debug strip — admin-only; advisory only. */
export async function SwarmSystemSection({ isAdmin }: { isAdmin: boolean }) {
  if (!swarmSystemFlags.swarmSystemV1 || !isAdmin) {
    return null;
  }

  const snap = await runSwarmCycle({ environment: "development" }).catch(() => null);
  if (!snap) {
    return (
      <div className="mt-3 rounded-lg border border-cyan-900/40 bg-cyan-950/15 px-3 py-2 text-[11px] text-zinc-400">
        <span className="font-semibold text-cyan-300/90">Swarm V1</span> · snapshot unavailable
      </div>
    );
  }

  const b = snap.bundle;
  const g = b.groupedBy;
  const inf = snap.influenceReport;
  return (
    <div className="mt-3 rounded-lg border border-cyan-900/40 bg-cyan-950/15 px-3 py-2 text-[11px] text-zinc-400">
      <span className="font-semibold text-cyan-300/90">Swarm V1</span> · proposals {b.opportunities.length} · conflicts{" "}
      {b.conflicts.length}
      <span className="text-zinc-600">
        {" "}
        · negotiation {String(swarmSystemFlags.swarmAgentNegotiationV1)} · primary {String(swarmSystemFlags.swarmAgentPrimaryV1)}
        {" "}
        · influence {String(swarmSystemFlags.swarmAgentInfluenceV1)}
      </span>
      <div className="mt-1 text-[10px] text-zinc-500">
        proceed {g.proceed.length} · caution {g.caution.length} · monitor {g.monitor.length} · defer {g.defer.length} ·
        blocked {g.blocked.length} · human_review {g.human_review.length}
      </div>
      {inf && inf.applied && (
        <div className="mt-1 text-[10px] text-cyan-200/70">
          influence · boosted {inf.agreementBoostCount} · caution {inf.conflictCautionCount} · human_review{" "}
          {inf.humanReviewEscalationCount} · monitor {inf.lowEvidenceMonitorCount} · skipped {inf.skippedInfluenceCount}
          {inf.reasonSummary ? <span className="text-zinc-500"> · {inf.reasonSummary}</span> : null}
        </div>
      )}
      {inf && !inf.applied && inf.skippedReason && (
        <div className="mt-1 text-[10px] text-amber-200/60">influence skipped · {inf.skippedReason}</div>
      )}
      {snap.health.observationalWarnings.slice(0, 2).map((w) => (
        <div key={w} className="mt-0.5 text-amber-200/80">
          {w}
        </div>
      ))}
    </div>
  );
}
