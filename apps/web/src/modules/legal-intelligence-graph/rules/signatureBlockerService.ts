type Args = {
  validation: { missingFields: string[]; contradictionFlags: string[] };
  status: string;
  signatures: Array<{ status: string }>;
};

export function detectSignatureBlockers(args: Args) {
  const out: Array<{ issueType: string; severity: "warning" | "critical" | "info"; title: string; message: string }> = [];
  if (!["approved", "finalized", "exported", "signed"].includes(args.status)) {
    out.push({ issueType: "signature_blocker", severity: "warning", title: "Not signature-ready", message: "Workflow status is not advanced enough for signature readiness." });
  }
  if (args.validation.missingFields.length || args.validation.contradictionFlags.length) {
    out.push({ issueType: "signature_blocker", severity: "critical", title: "Signature blocked by unresolved issues", message: "Resolve required fields and contradictions before signature." });
  }
  if (!args.signatures.length) {
    out.push({ issueType: "signature_blocker", severity: "warning", title: "No signature party", message: "No signature party is configured." });
  }
  return out;
}
