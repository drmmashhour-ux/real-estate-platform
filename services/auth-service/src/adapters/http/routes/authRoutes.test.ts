import { describe, it, expect } from "vitest";
import { Role, isRole } from "../../../domain/enums/Role.js";

describe("Role / isRole", () => {
  it("accepts all platform roles", () => {
    expect(isRole("GUEST")).toBe(true);
    expect(isRole("HOST")).toBe(true);
    expect(isRole("BROKER")).toBe(true);
    expect(isRole("OWNER")).toBe(true);
    expect(isRole("ADMIN")).toBe(true);
    expect(isRole("SUPPORT")).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(isRole("")).toBe(false);
    expect(isRole("guest")).toBe(false);
    expect(isRole("SUPERUSER")).toBe(false);
  });
});
