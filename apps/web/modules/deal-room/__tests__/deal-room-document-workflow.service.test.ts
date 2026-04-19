import { describe, expect, it, beforeEach } from "vitest";
import { PlatformRole } from "@prisma/client";

import {
  applyDocumentChecklistTemplate,
  attachDocumentToRequirement,
  buildDocumentPacketSummary,
  listMissingRequiredDocuments,
  listDocumentRequirements,
  addDocumentRequirement,
  updateDocumentRequirementStatus,
} from "../deal-room-document-workflow.service";
import { resetDealRoomDocumentMonitoringForTests } from "../deal-room-document-monitoring.service";
import {
  createDealRoom,
  resetDealRoomStoreForTests,
  listActivities,
} from "../deal-room.service";

describe("deal-room-document-workflow.service", () => {
  beforeEach(() => {
    resetDealRoomStoreForTests();
    resetDealRoomDocumentMonitoringForTests();
  });

  it("template apply creates requirements for matching room type", () => {
    const room = createDealRoom({
      entityType: "lead",
      entityId: "lead_1",
      createdBy: "u1",
      creatorRole: PlatformRole.ADMIN,
      creatorDisplayName: "Admin",
    });
    expect(room.ok).toBe(true);
    if (!room.ok) return;

    const applied = applyDocumentChecklistTemplate({
      roomId: room.room.id,
      templateId: "buyer_lead",
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.added).toBeGreaterThan(0);

    const reqs = listDocumentRequirements(room.room.id);
    expect(reqs.length).toBe(applied.added);
    expect(reqs.every((r) => r.dealRoomId === room.room.id)).toBe(true);
  });

  it("packet summary and missing-required detection are deterministic", () => {
    const room = createDealRoom({
      entityType: "listing",
      entityId: "lst",
      createdBy: "b1",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "B",
    });
    if (!room.ok) throw new Error("room");

    addDocumentRequirement({
      roomId: room.room.id,
      title: "Req A",
      category: "property",
      required: true,
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });
    addDocumentRequirement({
      roomId: room.room.id,
      title: "Opt B",
      category: "support",
      required: false,
      actorId: "b1",
      actorRole: PlatformRole.BROKER,
    });

    let summary = buildDocumentPacketSummary(room.room.id);
    expect(summary.totalRequired).toBe(1);
    expect(summary.approvedCount).toBe(0);
    expect(summary.missingCount).toBe(1);
    expect(summary.completionRate).toBe(0);

    let missing = listMissingRequiredDocuments(room.room.id);
    expect(missing.length).toBe(1);

    const reqs = listDocumentRequirements(room.room.id);
    const reqA = reqs.find((r) => r.title === "Req A");
    expect(reqA).toBeTruthy();
    if (!reqA) return;

    updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: reqA.id,
      status: "approved",
      actorId: "a1",
      actorRole: PlatformRole.ADMIN,
    });

    summary = buildDocumentPacketSummary(room.room.id);
    expect(summary.approvedCount).toBe(1);
    expect(summary.missingCount).toBe(0);
    expect(summary.completionRate).toBe(1);

    missing = listMissingRequiredDocuments(room.room.id);
    expect(missing.length).toBe(0);
  });

  it("requirement lifecycle emits activity entries", () => {
    const room = createDealRoom({
      entityType: "lead",
      entityId: "l",
      createdBy: "u1",
      creatorRole: PlatformRole.ADMIN,
      creatorDisplayName: "A",
    });
    if (!room.ok) throw new Error("room");

    const add = addDocumentRequirement({
      roomId: room.room.id,
      title: "Doc X",
      category: "identity",
      required: true,
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });
    expect(add.ok).toBe(true);

    updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: add.ok ? add.requirement.id : "",
      status: "requested",
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });

    const reqs = listDocumentRequirements(room.room.id);
    const id = reqs[0]?.id;
    expect(id).toBeTruthy();
    if (!id) return;

    const att = attachDocumentToRequirement({
      roomId: room.room.id,
      requirementId: id,
      title: "Link",
      kind: "external_link",
      url: "https://example.com/x",
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });
    expect(att.ok).toBe(true);

    updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: id,
      status: "under_review",
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });

    updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: id,
      status: "approved",
      actorId: "u1",
      actorRole: PlatformRole.ADMIN,
    });

    const acts = listActivities(room.room.id);
    const types = acts.map((a) => a.type);
    expect(types).toContain("doc_requirement_created");
    expect(types).toContain("doc_requirement_requested");
    expect(types).toContain("doc_requirement_attached");
    expect(types).toContain("doc_requirement_under_review");
    expect(types).toContain("doc_requirement_approved");
  });

  it("broker cannot approve; admin can", () => {
    const room = createDealRoom({
      entityType: "lead",
      entityId: "l2",
      createdBy: "br",
      creatorRole: PlatformRole.BROKER,
      creatorDisplayName: "Br",
    });
    if (!room.ok) throw new Error("room");

    const add = addDocumentRequirement({
      roomId: room.room.id,
      title: "R",
      category: "other",
      required: true,
      actorId: "br",
      actorRole: PlatformRole.BROKER,
    });
    if (!add.ok) throw new Error("add");
    const rid = add.requirement.id;

    const denied = updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: rid,
      status: "approved",
      actorId: "br",
      actorRole: PlatformRole.BROKER,
    });
    expect(denied.ok).toBe(false);

    const ok = updateDocumentRequirementStatus({
      roomId: room.room.id,
      requirementId: rid,
      status: "approved",
      actorId: "adm",
      actorRole: PlatformRole.ADMIN,
    });
    expect(ok.ok).toBe(true);
  });
});
