import { describe, expect, it } from "vitest";
import { flattenMessageTree, mergeMessageTrees } from "./flatten-messages";

describe("flattenMessageTree", () => {
  it("flattens nested groups to dot keys", () => {
    const flat = flattenMessageTree({
      common: { save: "Save" },
      auth: { login: "Login" },
    });
    expect(flat["common.save"]).toBe("Save");
    expect(flat["auth.login"]).toBe("Login");
  });

  it("preserves sellerDeclaration.title style paths", () => {
    const flat = flattenMessageTree({
      sellerDeclaration: { title: "Seller Declaration" },
    });
    expect(flat["sellerDeclaration.title"]).toBe("Seller Declaration");
  });
});

describe("mergeMessageTrees", () => {
  it("deep-merges overrides onto defaults", () => {
    const merged = mergeMessageTrees(
      { a: { x: "1", y: "2" }, b: "keep" },
      { a: { x: "override" } },
    );
    expect(merged).toEqual({ a: { x: "override", y: "2" }, b: "keep" });
  });
});
