import "server-only";

/** Feature flag: when true, stricter OACIQ alignment checks apply in eligible flows. */
export function oaciqAlignmentEnforcementEnabled(): boolean {
  const v = process.env.LECIPM_OACIQ_ALIGNMENT_ENFORCEMENT?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
