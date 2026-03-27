export function getCaseAIRecommendations(args: {
  blockingIssues: string[];
  missingDependencies: string[];
  crmLeadCount: number;
}) {
  const recs: Array<{ priority: "high" | "medium" | "low"; action: string }> = [];
  if (args.blockingIssues.length) recs.push({ priority: "high", action: "Resolve blocking legal issues before approval." });
  if (args.missingDependencies.length) recs.push({ priority: "high", action: "Complete missing dependencies highlighted in legal graph." });
  if (!args.blockingIssues.length && args.crmLeadCount > 0) recs.push({ priority: "medium", action: "Coordinate with CRM owner for timely client follow-up." });
  if (!recs.length) recs.push({ priority: "low", action: "Case appears stable; continue routine monitoring." });
  return recs;
}
