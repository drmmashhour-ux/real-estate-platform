import { describe, expect, it, vi } from "vitest";
import { LecipmWorkspaceRole } from "@prisma/client";
import { createWorkspaceInvite } from "../infrastructure/enterpriseWorkspaceService";

describe("createWorkspaceInvite seat limits", () => {
  it("returns error when members + pending invites reach seat limit", async () => {
    const db = {
      enterpriseWorkspaceMember: {
        count: vi.fn().mockResolvedValue(5),
      },
      enterpriseWorkspaceInvite: {
        count: vi.fn().mockResolvedValue(5),
        create: vi.fn(),
      },
    } as unknown as import("@prisma/client").PrismaClient;

    const result = await createWorkspaceInvite(db, {
      workspaceId: "ws-1",
      invitedByUserId: "u1",
      email: "a@b.com",
      role: LecipmWorkspaceRole.analyst,
      seatLimit: 10,
    });

    expect("error" in result && result.error).toBe("Seat limit reached");
    expect(db.enterpriseWorkspaceInvite.create).not.toHaveBeenCalled();
  });
});
