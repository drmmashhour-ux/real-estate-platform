/** OACIQ compliance copy + templates for regulator correspondence pages (additive; no `@prisma/client`). */

export const COMPLIANCE_POLICY = {
  summary:
    "LECIPM positions the platform as broker-operated technology aligned with Québec regulations. This is operational guidance — not legal advice.",
  brokerPlatformUse: {
    bullets: [
      "Prefer “operated by a licensed Québec broker” over implying regulatory endorsement.",
      "Highlight technology and workflow efficiency; avoid claiming OACIQ “approval” of the product.",
      "When in doubt, route marketing language through compliance review.",
    ],
  },
};

export const OACIQ_OUTREACH_TEMPLATES = {
  requestGuidanceEmail: {
    suggestedSubject: "Request for guidance — [product name] brokerage platform",
    body: `Dear OACIQ team,

We are writing to request guidance regarding [brief description of product / workflow].

Context:
- Licensed brokerage: [name / licence]
- Product: [one sentence]

Questions:
1) [Question 1]
2) [Question 2]

Thank you,
[Name]
[Title]
[Contact]`,
  },
};
