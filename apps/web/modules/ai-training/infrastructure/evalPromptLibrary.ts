export const EVAL_PROMPT_LIBRARY = {
  copilot_groundedness:
    "Answer must only reference provided deterministic payload and retrieved knowledge snippets. No invented facts.",
  crm_recommendation_quality:
    "Recommendation should align with lead score, trust score, deal score, and urgency.",
  seo_template_quality:
    "SEO draft should include relevant city-intent keywords and clear heading structure.",
} as const;
