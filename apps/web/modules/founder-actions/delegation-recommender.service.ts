import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";

/**
 * Suggested delegation targets from measurable queues only (no invented staffing levels).
 */
export function recommendDelegation(snapshot: FounderIntelligenceSnapshot): {
  title: string;
  rationale: string;
}[] {
  const out: { title: string; rationale: string }[] = [];
  if (snapshot.current.blockers.blockedDealRequests > 0) {
    out.push({
      title: "Coordination demandes dossier",
      rationale: `${snapshot.current.blockers.blockedDealRequests} demande(s) en statut bloqué — déléguer revue aux courtiers titulaires des dossiers.`,
    });
  }
  if (snapshot.current.compliance.openCases > 3) {
    out.push({
      title: "File conformité",
      rationale: `${snapshot.current.compliance.openCases} cas ouverts — déléguer tri initial à l’équipe conformité / supervision.`,
    });
  }
  return out.slice(0, 6);
}
