/**
 * Emergency / incident controls via environment variables (set in Vercel Production).
 * Never expose these to the client — read only on the server.
 */

function truthy(v: string | undefined): boolean {
  return v === "1" || v?.toLowerCase() === "true" || v?.toLowerCase() === "yes";
}

/** Block new account registration (API returns 503 with generic message). */
export function isPublicSignupDisabled(): boolean {
  return truthy(process.env.PLATFORM_DISABLE_PUBLIC_SIGNUP);
}

/** Block public lead/contact capture endpoints that are abuse-prone. */
export function isPublicContactDisabled(): boolean {
  return truthy(process.env.PLATFORM_DISABLE_PUBLIC_CONTACT_FORMS);
}

/** Block heavy admin/content AI generation routes (route-specific checks). */
export function isAiContentGenerationDisabled(): boolean {
  return truthy(process.env.PLATFORM_DISABLE_AI_CONTENT_GENERATION);
}

/** Broad automation brake (cron + internal routes that check this). */
export function isSensitiveAutomationDisabled(): boolean {
  return truthy(process.env.PLATFORM_DISABLE_SENSITIVE_AUTOMATIONS);
}

/** Optional message for maintenance-style responses (no secrets). */
export function maintenanceMessage(): string | null {
  const m = process.env.PLATFORM_MAINTENANCE_MESSAGE?.trim();
  return m && m.length > 0 ? m.slice(0, 500) : null;
}
