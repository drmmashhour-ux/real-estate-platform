import type { DealRoomPortalAccessLevel, DealRoomPortalCapability } from "./deal-room-portal.types";

export const DEAL_ROOM_PORTAL_ACCESS_LEVELS: DealRoomPortalAccessLevel[] = [
  "portal_read",
  "portal_comment",
  "portal_upload",
  "portal_limited_manage",
];

const ALL: DealRoomPortalCapability[] = [
  "view_status",
  "view_tasks",
  "view_documents",
  "upload_documents",
  "view_meetings",
  "view_safe_activity",
  "view_portal_notes",
  "add_note_limited",
];

const capSet = new Set<DealRoomPortalCapability>(ALL);

export function isPortalAccessLevel(s: string): s is DealRoomPortalAccessLevel {
  return (DEAL_ROOM_PORTAL_ACCESS_LEVELS as string[]).includes(s);
}

export function parsePortalCapabilities(input: unknown): DealRoomPortalCapability[] | null {
  if (!Array.isArray(input)) return null;
  const out: DealRoomPortalCapability[] = [];
  for (const x of input) {
    if (typeof x !== "string" || !capSet.has(x as DealRoomPortalCapability)) return null;
    out.push(x as DealRoomPortalCapability);
  }
  return out;
}
