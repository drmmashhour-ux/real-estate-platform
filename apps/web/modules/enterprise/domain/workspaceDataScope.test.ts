import { describe, expect, it } from "vitest";
import { LecipmWorkspaceRole } from "@prisma/client";
import {
  workspaceAiActionWhere,
  workspaceDealWhere,
  workspaceDocumentWhere,
  workspaceLeadWhere,
} from "./workspaceDataScope";

const WS = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const USER = "user-broker-1";

describe("workspaceDataScope", () => {
  it("scopes deals to workspace for admin", () => {
    expect(workspaceDealWhere(WS, LecipmWorkspaceRole.admin, USER)).toEqual({ workspaceId: WS });
  });

  it("restricts deals to broker ownership", () => {
    expect(workspaceDealWhere(WS, LecipmWorkspaceRole.broker, USER)).toEqual({
      AND: [{ workspaceId: WS }, { brokerId: USER }],
    });
  });

  it("scopes leads for viewer without broker filter", () => {
    expect(workspaceLeadWhere(WS, LecipmWorkspaceRole.viewer, USER)).toEqual({ workspaceId: WS });
  });

  it("restricts leads to introduced broker", () => {
    expect(workspaceLeadWhere(WS, LecipmWorkspaceRole.broker, USER)).toEqual({
      AND: [{ workspaceId: WS }, { introducedByBrokerId: USER }],
    });
  });

  it("restricts documents to uploader for broker", () => {
    expect(workspaceDocumentWhere(WS, LecipmWorkspaceRole.broker, USER)).toEqual({
      AND: [{ workspaceId: WS }, { uploadedById: USER }],
    });
  });

  it("scopes AI actions for broker to self", () => {
    expect(workspaceAiActionWhere(WS, LecipmWorkspaceRole.broker, USER)).toEqual({
      AND: [{ workspaceId: WS }, { userId: USER }],
    });
  });

  it("does not leak other users AI actions for analyst", () => {
    expect(workspaceAiActionWhere(WS, LecipmWorkspaceRole.analyst, USER)).toEqual({ workspaceId: WS });
  });
});
