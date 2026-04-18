/**
 * Narrative summary lines — derived from counts, not synthetic conversions.
 */
export function summarizeGrowthBlockers(opts: {
  openLeads: number;
  staleLeads: number;
  campaignsActive: number;
}): string[] {
  const lines: string[] = [];
  if (opts.staleLeads > 0) lines.push(`${opts.staleLeads} leads need follow-up past SLA.`);
  if (opts.openLeads > 20) lines.push("Pipeline is wide — tighten qualification criteria.");
  if (opts.campaignsActive === 0) lines.push("No saved UTM campaigns — create one to improve attribution.");
  if (lines.length === 0) lines.push("No major blockers detected from current signals.");
  return lines;
}
