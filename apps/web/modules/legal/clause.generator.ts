/**
 * Structural clause fragments for draft documents — not legal advice and not jurisdiction-specific rules.
 */

export type CancellationStrictness = "strict" | "moderate" | "flexible";

export type PaymentTermsInput = {
  currency?: string;
  totalAmountLabel?: string;
  depositLabel?: string;
  balanceDueTiming?: string;
  acceptedMethodsNote?: string;
};

export type LiabilityClauseInput = {
  /** Free text: caps, insurance, or exclusions the parties intend to discuss with counsel. */
  partyIntentNote?: string;
};

function header(title: string): string {
  return `### ${title}\n\n`;
}

/** Cancellation section — describes timing tiers in plain language; parties must align with real policies and law. */
export function generateCancellationClause(strictness: CancellationStrictness = "moderate"): string {
  const tier =
    strictness === "strict"
      ? [
          "- Full refund only if the guest cancels on or before **[date / hours — fill in]** before check-in.",
          "- Partial refund between **[window — fill in]** and check-in.",
          "- No refund after **[cutoff — fill in]** unless the host agrees otherwise or a separate policy applies.",
        ]
      : strictness === "flexible"
        ? [
            "- Full refund if cancelled **[hours/days — fill in]** before check-in.",
            "- Partial refund as described in **[table — fill in]**.",
            "- The host may define exceptions for holidays or special events in an addendum.",
          ]
        : [
            "- Full refund if cancelled **[hours/days — fill in]** before check-in.",
            "- 50% refund (or other percentage — fill in) if cancelled within **[window — fill in]**.",
            "- No refund within **[final window — fill in]** except as required by applicable rules or platform terms.",
          ];

  return (
    header("Cancellation (draft — complete dates and percentages)") +
    tier.join("\n") +
    "\n\n" +
    "_This block is a structural outline only. It does not state what the law requires in any location._\n"
  );
}

/** Bullet list only (for embedding in cancellation policy template without duplicate headings). */
export function generateCancellationOutline(strictness: CancellationStrictness = "moderate"): string {
  const block = generateCancellationClause(strictness);
  return block
    .replace(/^###[^\n]*\n\n/, "")
    .replace(/\n\n_This block is a structural outline only\.[\s\S]*$/m, "")
    .trim();
}

export function generatePaymentTermsClause(input: PaymentTermsInput = {}): string {
  const cur = input.currency?.trim() || "[currency]";
  const total = input.totalAmountLabel?.trim() || "[total amount]";
  const dep = input.depositLabel?.trim() || "[deposit if any]";
  const bal = input.balanceDueTiming?.trim() || "[when balance is due]";
  const methods = input.acceptedMethodsNote?.trim() || "[accepted payment methods — fill in]";

  return (
    header("Payment terms (draft)") +
    [
      `- **Total:** ${total} ${cur}`,
      `- **Deposit:** ${dep} ${cur}`,
      `- **Balance:** ${bal}`,
      `- **Methods:** ${methods}`,
      "- Late payment, chargebacks, and currency conversion are **[to be defined]**.",
    ].join("\n") +
    "\n\n" +
    "_Figures are placeholders supplied by the user or left blank for manual completion._\n"
  );
}

export function generateLiabilityClause(input: LiabilityClauseInput = {}): string {
  const note =
    input.partyIntentNote?.trim() ||
    "[Parties: describe intended limits, insurance requirements, and indemnities after review with counsel.]";

  return (
    header("Liability and risk allocation (draft)") +
    [
      "- Each party is responsible for maintaining appropriate insurance if they choose to do so.",
      `- **Intent discussed (not legal advice):** ${note}`,
      "- Nothing here limits non-waivable rights that may apply in the parties' jurisdiction.",
    ].join("\n") +
    "\n\n" +
    "_No specific statute, damages cap, or liability rule is asserted by this generator._\n"
  );
}
