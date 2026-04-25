/**
 * LECI escalation — human-in-the-loop for binding legal judgment and high-risk drafting.
 */

export type LeciResponseKind = "explanation" | "guidance" | "suggestion" | "warning" | "escalation";

export type LeciEscalationContext = {
  userMessage: string;
  pathname?: string;
  sectionHint?: string;
  focusTopic?: string;
  draftSummary?: string;
  /** broker | buyer | seller | admin | visitor | … */
  userRole?: string;
  /** e.g. blocked | warn | ok — from compliance UI when wired */
  complianceState?: string;
};

export const LECI_ESCALATION_MESSAGE_FR =
  "Cette situation nécessite une validation finale.\nUn courtier ou un responsable peut confirmer.";

const RE_FINAL_LEGAL =
  /(validation\s+finale|confirmation\s+(juridique|légale)|conseil\s+juridique\s+définitif|binding|opposable\s+en\s+justice|force\s+exécutoire)/i;
const RE_IS_VALID = /(est[- ]ce\s+(que\s+)?c'?est\s+valide|c'?est\s+valide|is\s+this\s+valid|legally\s+sound|valide\s+pour\s+signer|can\s+i\s+sign)/i;
const RE_HIGH_RISK_TOPIC =
  /(exclusion\s+(de\s+)?garantie|warranty\s+exclusion|renoncer\s+(\u00e0\s+)?la\s+garantie|waive.*warranty|clause\s+«\s*tel\s+quel\s*»|as-?is\s+clause)/i;
const RE_SIGN_COMMIT = /(signer|signature|approuv|finalis|soumettre\s+l'?offre|i\s+sign)/i;
const RE_CONFLICT = /(contradict|contredit|j'ai\s+mis.*mais|incompatible|deux\s+versions)/i;
const RE_UNCERTAINTY = /(pas\s+certain|pas\s+sûr|je\s+ne\s+suis\s+pas\s+sûr|i\s*'m\s+not\s+sure|hésit|est[- ]ce\s+risqué\s+pour\s+moi)/i;

export type EscalationEvaluation = {
  escalate: boolean;
  reasons: string[];
  escalationMessage: string;
  /** When not escalating, hint to tighten model behavior */
  systemBoost?: string;
};

/**
 * Hard escalation: short-circuit LECI — no simulated legal confirmation.
 */
export function evaluateEscalation(ctx: LeciEscalationContext): EscalationEvaluation {
  const t = ctx.userMessage.trim();
  const reasons: string[] = [];
  let escalate = false;

  if (RE_FINAL_LEGAL.test(t)) {
    escalate = true;
    reasons.push("final_legal_confirmation");
  }
  if (RE_IS_VALID.test(t)) {
    escalate = true;
    reasons.push("validity_confirmation");
  }
  if (RE_HIGH_RISK_TOPIC.test(t) && RE_SIGN_COMMIT.test(t)) {
    escalate = true;
    reasons.push("high_risk_commitment");
  }
  if (RE_CONFLICT.test(t)) {
    escalate = true;
    reasons.push("conflicting_inputs");
  }
  if (RE_UNCERTAINTY.test(t) && RE_SIGN_COMMIT.test(t)) {
    escalate = true;
    reasons.push("uncertainty_with_commitment");
  }
  if ((ctx.complianceState === "blocked" || ctx.complianceState === "fail") && RE_SIGN_COMMIT.test(t)) {
    escalate = true;
    reasons.push("compliance_blocked_sign");
  }
  if (ctx.focusTopic && /warranty|garantie|exclusion/i.test(ctx.focusTopic) && RE_IS_VALID.test(t)) {
    escalate = true;
    reasons.push("warranty_context_validity");
  }

  const dedup = [...new Set(reasons)];

  let systemBoost: string | undefined;
  if (!escalate && (RE_HIGH_RISK_TOPIC.test(t) || /garantie\s+légale/i.test(t))) {
    systemBoost =
      "User topic is sensitive (warranty / exclusion). Use WARNING tone: explain generally, list typical risks, never confirm legality or tell them to sign.";
  }

  return {
    escalate,
    reasons: dedup,
    escalationMessage: LECI_ESCALATION_MESSAGE_FR,
    systemBoost,
  };
}

/**
 * Classify the intended response shape for logging / UI badges (non-escalated turns).
 */
export function classifyResponseKind(
  ctx: LeciEscalationContext,
  opts?: { forceWarning?: boolean },
): LeciResponseKind {
  if (opts?.forceWarning) return "warning";
  const t = ctx.userMessage.toLowerCase();
  if (/risque|risk|danger|exposure|what.*go wrong/.test(t)) return "warning";
  if (/simplif|explain|explique|c'est quoi|what is|défin/i.test(t)) return "explanation";
  if (/suggest|amélior|wording|formul|mieux dire|alternative/.test(t)) return "suggestion";
  if (/que faire|next step|prochaine étape|should i|comment faire/.test(t)) return "guidance";
  return "explanation";
}

export function leciSafeRulesPreamble(): string {
  return [
    "Response types to use implicitly: explanation | guidance | suggestion | warning | escalation.",
    "Tone: neutral, informative, structured (short bullets).",
    "NEVER: confirm legality, approve a contract, replace broker advice, guarantee outcomes.",
    "Broker mode: speed up drafting, catch errors, give phrasing to explain to clients — still escalate when user asks if something is 'valid' or legally final.",
    "Visitor/buyer/seller mode: simple language, reduce confusion, suggest safer next steps — still escalate binding questions.",
    "Drafting: you may clarify clauses and suggest wording; outputs must pass human/compliance validation — say so when relevant.",
  ].join("\n");
}
