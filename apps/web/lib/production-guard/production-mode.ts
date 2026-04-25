/**
 * LECIPM ProductionGuard — runtime mode flags (server-only).
 *
 * **`PRODUCTION_MODE=true`**: form strict keys, minimum compliance for signature, verbose audit metadata when
 * `PRODUCTION_GUARD_VERBOSE_LOG` is unset (verbose follows `isProductionGuardVerboseLogging`), AI fallback enforced
 * (see `isAiFallbackEnforced`). Never set `PRODUCTION_GUARD_RELAXED` in real prod.
 */

export function isProductionMode(): boolean {
  return process.env.PRODUCTION_MODE === "true";
}

/**
 * When true, AI draft failures should use base templates and continue safely.
 */
export function isAiFallbackEnforced(): boolean {
  return isProductionMode() || process.env.PRODUCTION_GUARD_AI_FALLBACK === "true";
}

/**
 * Structured logging / verbose audit metadata in production.
 */
export function isProductionGuardVerboseLogging(): boolean {
  return isProductionMode() || process.env.PRODUCTION_GUARD_VERBOSE_LOG === "true";
}

/**
 * **Local / staging only.** When set, signature gate treats some checks as non-blocking warnings.
 * Must never be enabled in real production environments.
 */
export function isProductionGuardRelaxed(): boolean {
  return process.env.PRODUCTION_GUARD_RELAXED === "true";
}

export function productionGuardComplianceMinScore(): number {
  const raw = process.env.PRODUCTION_GUARD_COMPLIANCE_MIN;
  const n = raw ? Number(raw) : isProductionMode() ? 70 : 55;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 70;
}
