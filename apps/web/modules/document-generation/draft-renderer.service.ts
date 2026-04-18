import type { PrefillEngineResult } from "@/modules/prefill/prefill.types";

/** Human-readable draft text for broker review — not an official PDF. */
export function renderHumanReadableDraft(prefill: PrefillEngineResult): string {
  const lines = [
    `[DRAFT — NOT FOR EXECUTION]`,
    prefill.draftNotice,
    `Form: ${prefill.formKey}`,
    "",
    "Mapped fields (verify):",
    JSON.stringify(prefill.mappedFields, null, 2),
    "",
    "Missing / required:",
    prefill.missingRequiredFields.join(", ") || "(none flagged)",
    "",
    "Warnings:",
    ...prefill.warnings.map((w) => `- ${w}`),
  ];
  return lines.join("\n");
}
