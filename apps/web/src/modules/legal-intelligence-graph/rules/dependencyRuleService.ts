type Args = {
  payload: Record<string, unknown>;
  validation: { missingFields: string[] };
  signatures: Array<{ signerName: string; signerEmail: string }>;
};

export function detectMissingDependencies(args: Args) {
  const issues: Array<{ issueType: string; severity: "warning" | "critical" | "info"; title: string; message: string; metadata?: Record<string, unknown>; relatedFactKey?: string }> = [];
  if (args.validation.missingFields.length) {
    issues.push({
      issueType: "missing_dependency",
      severity: "warning",
      title: "Missing required dependencies",
      message: `Required fields missing: ${args.validation.missingFields.join(", ")}`,
      metadata: { missingFields: args.validation.missingFields },
    });
  }
  if ((args.payload.tenant_present === true || args.payload.tenant_present === "true") && !String(args.payload.lease_details ?? "").trim()) {
    issues.push({ issueType: "missing_dependency", severity: "critical", title: "Tenant disclosure missing", message: "Tenant is present but lease details are absent.", relatedFactKey: "tenant_present" });
  }
  if (!args.signatures.length) {
    issues.push({ issueType: "missing_dependency", severity: "warning", title: "Signature dependency missing", message: "No signature parties are configured yet." });
  }
  return issues;
}
