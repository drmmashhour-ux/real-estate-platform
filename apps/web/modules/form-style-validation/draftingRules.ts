import { TurboDraftInput } from "../turbo-form-drafting/types";

export interface DraftingRule {
  id: string;
  check: (input: TurboDraftInput) => { valid: boolean; message?: string };
  severity: "CRITICAL" | "WARNING";
}

export const DRAFTING_RULES: DraftingRule[] = [
  {
    id: "price_must_exist",
    check: (input) => ({
      valid: !!input.answers.purchasePrice || !!input.answers.listingPrice,
      message: "A price must be specified."
    }),
    severity: "CRITICAL"
  },
  {
    id: "parties_must_exist",
    check: (input) => ({
      valid: input.parties.length >= 1,
      message: "At least one party must be identified."
    }),
    severity: "CRITICAL"
  },
  {
    id: "representation_disclosure",
    check: (input) => ({
      valid: input.representedStatus === "REPRESENTED" || !!input.answers.representationAck,
      message: "Representation must be disclosed if not represented by a broker."
    }),
    severity: "CRITICAL"
  }
];
