export function declarationPdfTemplate(args: {
  documentId: string;
  payload: Record<string, unknown>;
  validationSummary?: Record<string, unknown> | null;
  generatedAtIso: string;
}) {
  const lines: string[] = [];
  lines.push("LECIPM - Seller Declaration");
  lines.push(`Reference: ${args.documentId}`);
  lines.push(`Generated: ${args.generatedAtIso}`);
  lines.push("");
  lines.push("Declaration Content");
  for (const [k, v] of Object.entries(args.payload)) lines.push(`${k}: ${String(v ?? "")}`);
  lines.push("");
  lines.push("Validation Summary");
  if (args.validationSummary) {
    for (const [k, v] of Object.entries(args.validationSummary)) lines.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  } else {
    lines.push("No validation snapshot available.");
  }
  lines.push("");
  lines.push("Not legal advice. Final legal review required before execution.");
  return lines.join("\\n");
}
