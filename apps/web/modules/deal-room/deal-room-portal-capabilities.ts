import type { DealRoomPortalAccessLevel, DealRoomPortalCapability } from "./deal-room-portal.types";

/** Conservative defaults — internal UI can override with explicit capability lists. */
export function defaultCapabilitiesForAccessLevel(level: DealRoomPortalAccessLevel): DealRoomPortalCapability[] {
  const base: DealRoomPortalCapability[] = [
    "view_status",
    "view_tasks",
    "view_documents",
    "view_meetings",
    "view_safe_activity",
    "view_portal_notes",
  ];
  switch (level) {
    case "portal_read":
      return [...base];
    case "portal_comment":
      return [...base, "add_note_limited"];
    case "portal_upload":
      return [...base, "upload_documents"];
    case "portal_limited_manage":
      return [...base, "upload_documents"];
    default:
      return [...base];
  }
}

export function mergeParticipantCapabilities(args: {
  level: DealRoomPortalAccessLevel;
  explicit?: DealRoomPortalCapability[] | null;
}): DealRoomPortalCapability[] {
  const defaults = defaultCapabilitiesForAccessLevel(args.level);
  if (args.explicit && args.explicit.length > 0) {
    const set = new Set<DealRoomPortalCapability>([...defaults, ...args.explicit]);
    return Array.from(set);
  }
  return defaults;
}

export function participantHasCapability(
  caps: DealRoomPortalCapability[] | undefined,
  cap: DealRoomPortalCapability
): boolean {
  return Boolean(caps?.includes(cap));
}
