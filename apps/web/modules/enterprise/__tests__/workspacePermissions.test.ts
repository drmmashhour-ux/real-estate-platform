import { describe, expect, it } from "vitest";
import { LecipmWorkspaceRole } from "@prisma/client";
import { roleHasPermission } from "../domain/workspacePermissions";

describe("roleHasPermission", () => {
  it("denies viewer from manage_workspace", () => {
    expect(roleHasPermission(LecipmWorkspaceRole.viewer, "manage_workspace")).toBe(false);
  });

  it("allows owner for manage_members", () => {
    expect(roleHasPermission(LecipmWorkspaceRole.owner, "manage_members")).toBe(true);
  });

  it("allows compliance_reviewer for review_compliance_cases", () => {
    expect(roleHasPermission(LecipmWorkspaceRole.compliance_reviewer, "review_compliance_cases")).toBe(true);
  });
});
