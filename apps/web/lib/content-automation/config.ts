import { ContentAutomationApprovalMode, ContentAutomationPlatformTarget } from "@prisma/client";

/**
 * CONTENT_AUTOMATION_APPROVAL_MODE: manual | auto_schedule | auto_publish
 * Default: manual
 */
export function resolveApprovalMode(
  override?: ContentAutomationApprovalMode | null
): ContentAutomationApprovalMode {
  if (override != null) return override;
  const v = process.env.CONTENT_AUTOMATION_APPROVAL_MODE?.trim().toLowerCase();
  if (v === "auto_schedule") return ContentAutomationApprovalMode.AUTO_SCHEDULE;
  if (v === "auto_publish") return ContentAutomationApprovalMode.AUTO_PUBLISH;
  return ContentAutomationApprovalMode.MANUAL;
}

/**
 * CONTENT_AUTOMATION_DEFAULT_PLATFORMS — comma list: tiktok, instagram (default both)
 */
export function parseDefaultPlatformTarget(): ContentAutomationPlatformTarget {
  const raw = process.env.CONTENT_AUTOMATION_DEFAULT_PLATFORMS?.trim() || "tiktok,instagram";
  const parts = raw.split(",").map((s) => s.trim().toLowerCase());
  const hasT = parts.some((p) => p === "tiktok" || p === "tt");
  const hasI = parts.some((p) => p === "instagram" || p === "ig");
  if (hasT && hasI) return ContentAutomationPlatformTarget.BOTH;
  if (hasT) return ContentAutomationPlatformTarget.TIKTOK;
  if (hasI) return ContentAutomationPlatformTarget.INSTAGRAM;
  return ContentAutomationPlatformTarget.BOTH;
}
