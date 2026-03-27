type Args = { validation: { contradictionFlags: string[]; missingFields: string[] }; status: string };

export function detectReviewBlockers(args: Args) {
  const out: Array<{ issueType: string; severity: "warning" | "critical" | "info"; title: string; message: string }> = [];
  if (["approved", "finalized", "exported"].includes(args.status) && args.validation.contradictionFlags.length) {
    out.push({ issueType: "review_blocker", severity: "critical", title: "Approval blocked", message: "Open contradiction flags should block approval/finalization." });
  }
  if (["approved", "finalized"].includes(args.status) && args.validation.missingFields.length) {
    out.push({ issueType: "review_blocker", severity: "warning", title: "Review dependency open", message: "Required missing fields should be resolved before higher workflow states." });
  }
  return out;
}
