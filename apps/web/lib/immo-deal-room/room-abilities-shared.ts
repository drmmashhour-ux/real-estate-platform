import type { DealRoom } from "@/modules/deal-room/deal-room.types";

export function contextLinkForRoom(room: DealRoom): { href: string; label: string } {
  switch (room.entityType) {
    case "listing":
      return { href: `/listings/${encodeURIComponent(room.entityId)}`, label: "Listing" };
    case "lead":
      return { href: `/dashboard/leads/${encodeURIComponent(room.entityId)}`, label: "Lead" };
    case "broker":
      return { href: "/dashboard/broker", label: "Broker workspace" };
    case "booking":
      return { href: "/dashboard/bnhub", label: "BNHUB" };
    case "property":
      return { href: `/listings/${encodeURIComponent(room.entityId)}`, label: "Property" };
    default:
      return { href: "#", label: "Unknown" };
  }
}
