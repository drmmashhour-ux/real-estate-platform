import { describe, expect, it } from "vitest";
import { isFinancialStaff, isAdminOnly } from "../finance-access";

describe("finance-access", () => {
  it("allows ADMIN and ACCOUNTANT", () => {
    expect(isFinancialStaff("ADMIN")).toBe(true);
    expect(isFinancialStaff("ACCOUNTANT")).toBe(true);
    expect(isFinancialStaff("USER")).toBe(false);
    expect(isFinancialStaff(null)).toBe(false);
  });
  it("admin-only is only ADMIN", () => {
    expect(isAdminOnly("ADMIN")).toBe(true);
    expect(isAdminOnly("ACCOUNTANT")).toBe(false);
  });
});
