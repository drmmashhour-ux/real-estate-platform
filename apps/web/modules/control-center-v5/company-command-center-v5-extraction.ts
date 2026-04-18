/**
 * Source-grounded strings for mode mappers — no invented business metrics.
 */
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import { needsAttentionStatus } from "./control-center-v5-status-mapper";

export function keySystemsNeedingAttention(v4: CompanyCommandCenterV4Payload): { id: string; label: string; status: string; note: string }[] {
  const s = v4.v3.shared.systems;
  if (!s) return [];
  const rows: { id: string; label: string; status: string; note: string }[] = [
    { id: "brain", label: "Brain V8", status: s.brain.status, note: s.brain.summary.slice(0, 80) },
    { id: "ads", label: "Ads V8", status: s.ads.status, note: s.ads.summary.slice(0, 80) },
    { id: "cro", label: "CRO V8", status: s.cro.status, note: s.cro.summary.slice(0, 80) },
    { id: "ranking", label: "Ranking V8", status: s.ranking.status, note: s.ranking.summary.slice(0, 80) },
    { id: "operator", label: "Operator V2", status: s.operator.status, note: s.operator.summary.slice(0, 80) },
    { id: "platform_core", label: "Platform Core", status: s.platformCore.status, note: s.platformCore.summary.slice(0, 80) },
    { id: "fusion", label: "Fusion", status: s.fusion.status, note: s.fusion.summary.slice(0, 80) },
    { id: "growth_loop", label: "Growth loop", status: s.growthLoop.status, note: s.growthLoop.summary.slice(0, 80) },
    { id: "swarm", label: "Swarm", status: s.swarm.status, note: s.swarm.summary.slice(0, 80) },
  ];
  return rows.filter((r) => needsAttentionStatus(r.status as ControlCenterUnifiedStatus)).slice(0, 8);
}

export function topDigestSeverity(v4: CompanyCommandCenterV4Payload): "info" | "watch" | "warning" | "critical" | null {
  const c = v4.anomalyDigest.countsBySeverity;
  if (c.critical > 0) return "critical";
  if (c.warning > 0) return "warning";
  if (c.watch > 0) return "watch";
  if (c.info > 0) return "info";
  return null;
}
