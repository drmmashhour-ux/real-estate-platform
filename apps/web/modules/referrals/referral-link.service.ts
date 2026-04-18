import { randomBytes } from "node:crypto";

/** Generate a unique referral code candidate — DB uniqueness enforced on insert. */
export function generateReferralCodeCandidate(): string {
  return `R${randomBytes(6).toString("hex")}`;
}
