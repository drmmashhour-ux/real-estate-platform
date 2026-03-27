import { describe, it, expect } from "vitest";
import { BcryptPasswordHasher } from "./BcryptPasswordHasher.js";

describe("BcryptPasswordHasher", () => {
  const hasher = new BcryptPasswordHasher();

  it("hashes and verifies password", async () => {
    const plain = "SecureP@ss123";
    const hash = await hasher.hash(plain);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(plain);
    expect(await hasher.verify(plain, hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hasher.hash("correct");
    expect(await hasher.verify("wrong", hash)).toBe(false);
  });
});
