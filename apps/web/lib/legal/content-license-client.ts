/**
 * Client-safe helpers for Content & Usage License UX (no server-only imports).
 */

export const CONTENT_LICENSE_ERROR = "CONTENT_LICENSE_REQUIRED" as const;

export class ContentLicenseRequiredError extends Error {
  constructor() {
    super("CONTENT_LICENSE_REQUIRED");
    this.name = "ContentLicenseRequiredError";
  }
}
