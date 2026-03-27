type Args = { payload: Record<string, unknown>; validation: { contradictionFlags: string[] }; status: string };

export function detectContradictions(args: Args) {
  const issues: Array<{ issueType: string; severity: "warning" | "critical" | "info"; title: string; message: string; metadata?: Record<string, unknown>; relatedFactKey?: string }> = [];
  for (const flag of args.validation.contradictionFlags) {
    issues.push({ issueType: "contradiction", severity: "critical", title: "Contradiction detected", message: flag });
  }
  const noTenant = args.payload.tenant_present === false || args.payload.tenant_present === "false";
  if (noTenant && String(args.payload.lease_details ?? "").trim()) {
    issues.push({ issueType: "contradiction", severity: "warning", title: "Tenant mismatch", message: "Lease details provided while tenant flag is false.", relatedFactKey: "tenant_present" });
  }
  return issues;
}
