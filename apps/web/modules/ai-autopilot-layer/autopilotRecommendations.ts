/**
 * Curated example recommendations (documentation / tests / UI samples).
 */

export const SAMPLE_AUTOPILOT_RECOMMENDATIONS = [
  {
    actionKey: "suggest_broker_review",
    reasonFr:
      "L’acheteur n’est pas représenté. Le système recommande une révision par un courtier afin de mieux protéger ses intérêts.",
  },
  {
    actionKey: "suggest_clause_rewrite",
    reasonFr: "La clause d’exclusion de garantie doit être claire et non équivoque.",
  },
  {
    actionKey: "suggest_missing_field",
    reasonFr: "Le délai de financement doit être précisé avant de finaliser la promesse d’achat.",
  },
  {
    actionKey: "prepare_payment_checkout",
    reasonFr: "Le paiement est requis avant l’export final du document.",
  },
] as const;
