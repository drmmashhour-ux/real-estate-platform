import { describe, expect, it, beforeEach } from "vitest";
import { PlatformRole } from "@prisma/client";

import {
  addNote,
  addParticipant,
  assertCanViewRoom,
  buildDealRoomTitle,
  createDealRoom,
  createDealRoomMeeting,
  getDealRoom,
  listActivities,
  removeParticipant,
  resetDealRoomStoreForTests,
  updateDealRoomStatus,
  updateTask,
  createTask,
} from "../deal-room.service";
import { canManageDealRoom } from "../deal-room-access";

describe("deal-room.service", () => {
  beforeEach(() => {
    resetDealRoomStoreForTests();
  });

  it("buildDealRoomTitle is deterministic per entity type", () => {
    expect(buildDealRoomTitle("listing", "abc123")).toContain("Listing");
    expect(buildDealRoomTitle("lead", "lead_x")).toContain("Lead");
    expect(buildDealRoomTitle("broker", "u1", "Jane")).toBe("Deal Room · Jane");
  });

  it("creates a room for broker and seeds creator as manage participant", () => {
    const r = createDealRoom({
      entityType: "listing",
      entityId: "lst_1",
      createdBy: "user_broker",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "Broker Pat",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.room.status).toBe("open");
    expect(r.room.title).toContain("Listing");

    const acts = listActivities(r.room.id);
    expect(acts.some((a) => a.type === "created")).toBe(true);
  });

  it("rejects creation for non-broker/non-operator roles", () => {
    const r = createDealRoom({
      entityType: "lead",
      entityId: "l1",
      createdBy: "buyer1",
      creatorRole: PlatformRole.BUYER,
      creatorDisplayName: "Buyer",
    });
    expect(r.ok).toBe(false);
  });

  it("adds and removes participants with activity entries", () => {
    const created = createDealRoom({
      entityType: "lead",
      entityId: "lead_1",
      createdBy: "admin1",
      creatorRole: PlatformRole.ADMIN,
      creatorDisplayName: "Admin",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const roomId = created.room.id;

    const add = addParticipant({
      roomId,
      displayName: "Reviewer Alex",
      role: "reviewer",
      accessLevel: "read",
      actorId: "admin1",
      actorRole: PlatformRole.ADMIN,
    });
    expect(add.ok).toBe(true);

    expect(listActivities(roomId).some((a) => a.type === "participant_added")).toBe(true);

    const partId = add.ok ? add.participantId : "";
    const rem = removeParticipant({
      roomId,
      participantId: partId,
      actorId: "admin1",
      actorRole: PlatformRole.ADMIN,
    });
    expect(rem.ok).toBe(true);
    expect(listActivities(roomId).some((a) => a.type === "participant_removed")).toBe(true);
  });

  it("note and task lifecycles record activity", () => {
    const c = createDealRoom({
      entityType: "listing",
      entityId: "x",
      createdBy: "b1",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "B",
    });
    if (!c.ok) throw new Error("room");
    const room = c.room;

    const n = addNote({ roomId: room.id, body: "Hello", authorId: "b1", authorRole: PlatformRole.BROKER });
    expect(n.ok).toBe(true);
    expect(listActivities(room.id).some((a) => a.type === "note_added")).toBe(true);

    const t = createTask({
      roomId: room.id,
      title: "Follow up",
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });
    expect(t.ok).toBe(true);
    const taskId = t.ok ? t.taskId : "";
    expect(listActivities(room.id).some((a) => a.type === "task_created")).toBe(true);

    const u = updateTask({
      roomId: room.id,
      taskId,
      status: "done",
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });
    expect(u.ok).toBe(true);
    expect(listActivities(room.id).some((a) => a.type === "task_updated")).toBe(true);
  });

  it("meeting creation and status change append activity", () => {
    const c = createDealRoom({
      entityType: "property",
      entityId: "p1",
      createdBy: "b1",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "B",
    });
    if (!c.ok) throw new Error("room");
    const room = c.room;

    const m = createDealRoomMeeting({
      roomId: room.id,
      provider: "manual",
      title: "Call",
      manualUrl: "https://example.com/join",
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });
    expect(m.ok).toBe(true);
    expect(listActivities(room.id).some((a) => a.type === "meeting_created")).toBe(true);

    const s = updateDealRoomStatus({
      roomId: room.id,
      status: "active",
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });
    expect(s.ok).toBe(true);
    expect(listActivities(room.id).some((a) => a.type === "status_changed")).toBe(true);
  });

  it("access: buyer cannot manage broker-created room", () => {
    const c = createDealRoom({
      entityType: "lead",
      entityId: "z",
      createdBy: "broker_x",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "BX",
    });
    if (!c.ok) throw new Error("room");
    const room = getDealRoom(c.room.id);
    expect(room).toBeTruthy();
    if (!room) return;

    expect(canManageDealRoom({ userId: "broker_x", userRole: PlatformRole.BROKER, room })).toBe(true);
    expect(canManageDealRoom({ userId: "buyer_y", userRole: PlatformRole.BUYER, room })).toBe(false);
    expect(assertCanViewRoom({ userId: "buyer_y", userRole: PlatformRole.BUYER, room })).toBe(false);
  });
});
