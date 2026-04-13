import type { AdminAiEntityType } from "@prisma/client";

export function adminHrefForEntity(
  entityType: AdminAiEntityType | null | undefined,
  entityId: string | null | undefined
): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "listing":
      return `/admin/fsbo/${entityId}`;
    case "user":
      return `/admin/live-debug/user/${entityId}`;
    case "payment":
      return `/admin/finance`;
    case "revenue":
      return `/admin/revenue`;
    case "document_request":
      return `/admin/fsbo`;
    case "support":
      return `/admin/forms`;
    case "funnel":
      return `/admin/funnel`;
    default:
      return null;
  }
}

/** FSBO vs CRM listing ids — FSBO admin path when kind is fsbo. */
export function listingAdminHref(kind: "fsbo" | "crm", listingId: string): string {
  return kind === "fsbo" ? `/admin/fsbo/${listingId}` : `/admin/listings`;
}
