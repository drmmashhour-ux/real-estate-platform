export function generateSignatureReadinessPackage(args: {
  validationComplete: boolean;
  blockingIssues: string[];
  signatureReady: boolean;
  signatureReasons: string[];
}) {
  const checklist: string[] = [];
  checklist.push(args.validationComplete ? "Validation complete (deterministic)" : "Complete validation before signature");
  checklist.push(args.blockingIssues.length === 0 ? "No legal-graph blockers" : `Resolve blockers: ${args.blockingIssues.slice(0, 3).join("; ")}`);
  checklist.push(args.signatureReady ? "Signature readiness: OK" : `Signature not ready: ${args.signatureReasons.join("; ")}`);
  return {
    ready: args.validationComplete && args.blockingIssues.length === 0 && args.signatureReady,
    checklist,
  };
}
