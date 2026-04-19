/**
 * V1 access control — internal-first; explicit levels on participants.
 */

import type { PlatformRole } from "@prisma/client";

import type { DealRoom, DealRoomAccessLevel, DealRoomParticipant } from "./deal-room.types";
import { getParticipant, participantIdsForRoom } from "./deal-room.store";

export function roleIsAdmin(role: PlatformRole | undefined): boolean {
  return role === "ADMIN";
}

export function roleIsBrokerOrAdmin(role: PlatformRole | undefined): boolean {
  return role === "ADMIN" || role === "BROKER";
}

/** Internal ops roles — V1 treat like admin for collaboration room access (monitoring, support). */
export function roleIsInternalOperator(role: PlatformRole | undefined): boolean {
  return (
    role === "CONTENT_OPERATOR" ||
    role === "LISTING_OPERATOR" ||
    role === "OUTREACH_OPERATOR" ||
    role === "SUPPORT_AGENT"
  );
}

export function roleCanUseImmoDealRooms(role: PlatformRole | undefined): boolean {
  return (
    roleIsAdmin(role) ||
    roleIsBrokerOrAdmin(role) ||
    role === "MORTGAGE_BROKER" ||
    roleIsInternalOperator(role)
  );
}

function participantForUser(roomId: string, userId: string): DealRoomParticipant | undefined {
  for (const pid of participantIdsForRoom(roomId)) {
    const p = getParticipant(pid);
    if (p?.userId === userId) return p;
  }
  return undefined;
}

export function canAccessDealRoom(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): boolean {
  if (roleIsAdmin(args.userRole)) return true;
  if (roleIsInternalOperator(args.userRole)) return true;
  if (args.room.createdBy === args.userId) return true;
  return Boolean(participantForUser(args.room.id, args.userId));
}

const rank: Record<DealRoomAccessLevel, number> = {
  read: 0,
  comment: 1,
  edit: 2,
  manage: 3,
};

function levelAtLeast(level: DealRoomAccessLevel, min: DealRoomAccessLevel): boolean {
  return rank[level] >= rank[min];
}

export function canComment(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): boolean {
  if (!canAccessDealRoom(args)) return false;
  if (roleIsAdmin(args.userRole) || roleIsInternalOperator(args.userRole)) return true;
  const p = participantForUser(args.room.id, args.userId);
  if (args.room.createdBy === args.userId) return true;
  return p ? levelAtLeast(p.accessLevel, "comment") : false;
}

export function canEditTasksAndDocs(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): boolean {
  if (!canAccessDealRoom(args)) return false;
  if (roleIsAdmin(args.userRole) || roleIsInternalOperator(args.userRole)) return true;
  const p = participantForUser(args.room.id, args.userId);
  if (args.room.createdBy === args.userId) return true;
  return p ? levelAtLeast(p.accessLevel, "edit") : false;
}

export function canManageDealRoom(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): boolean {
  if (!canAccessDealRoom(args)) return false;
  if (roleIsAdmin(args.userRole) || roleIsInternalOperator(args.userRole)) return true;
  const p = participantForUser(args.room.id, args.userId);
  if (args.room.createdBy === args.userId) return true;
  return p ? levelAtLeast(p.accessLevel, "manage") : false;
}
