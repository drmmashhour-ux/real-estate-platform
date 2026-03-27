type Args = {
  status: string;
  signatures: Array<{ status: string }>;
  validation: { contradictionFlags: string[] };
};

export function detectWorkflowInconsistencies(args: Args) {
  const out: Array<{ issueType: string; severity: "warning" | "critical" | "info"; title: string; message: string }> = [];
  const hasSigned = args.signatures.some((s) => s.status === "signed");
  if (hasSigned && !["approved", "finalized", "exported", "signed"].includes(args.status)) {
    out.push({ issueType: "workflow_inconsistency", severity: "critical", title: "Signed before approval", message: "Signature appears completed before approval/finalization state." });
  }
  if (args.status === "finalized" && args.validation.contradictionFlags.length) {
    out.push({ issueType: "workflow_inconsistency", severity: "critical", title: "Finalized with contradictions", message: "Finalized status conflicts with open contradiction flags." });
  }
  if (args.status === "exported" && args.validation.contradictionFlags.length) {
    out.push({ issueType: "workflow_inconsistency", severity: "warning", title: "Exported with unresolved flags", message: "Exported while unresolved contradictions remain." });
  }
  return out;
}
