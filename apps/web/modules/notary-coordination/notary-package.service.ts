import type { NotaryPackageItem } from "./notary-coordination.types";

const DEFAULT_CHECKLIST: NotaryPackageItem[] = [
  { key: "signed_pp_cp", label: "Signed promise to purchase / counter-proposals / annexes", done: false },
  { key: "seller_declaration", label: "Seller declaration package validated (as applicable)", done: false },
  { key: "identity_path", label: "Identity verification path per notary instructions", done: false },
  { key: "lender_instructions", label: "Lender closing instructions / undertaking path", done: false },
  { key: "deposit_trust", label: "Deposit / trust confirmation trail (as applicable)", done: false },
];

export function defaultNotaryPackageChecklist(): NotaryPackageItem[] {
  return DEFAULT_CHECKLIST.map((x) => ({ ...x }));
}
