/**
 * OACIQ guideline “Selection and oversight of agency licensees and employees” (Dec 15, 2022)
 * — adapted for a non-agency, solo residential broker platform.
 *
 * Legal meaning: informational system configuration; not legal advice.
 */

/** §1 Core principle: compliance framing is mandatory in product logic (no optional compliance mode). */
export const COMPLIANCE_REQUIRED = true as const;
export const COMPLIANCE_OPTIONAL = false as const;

/**
 * Platform stance vs OACIQ “agency executive officer” role:
 * the product assists; it does not supervise courtiers like an agency EO.
 */
export type PlatformComplianceStance = "compliance_assistant_only";

export const PLATFORM_COMPLIANCE_ROLE: PlatformComplianceStance = "compliance_assistant_only";
