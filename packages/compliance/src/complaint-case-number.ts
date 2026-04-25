export function buildComplaintCaseNumber(): string {
  const now = new Date();
  return `CMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

/** Anonymous / platform-scoped public intake owner id (not a User row). */
export const COMPLAINT_PLATFORM_OWNER_ID = "lecipm";
