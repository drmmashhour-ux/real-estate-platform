export function buildNeighborhoodPrompt(input: {
  neighborhoodName: string;
  city: string;
  scores: Record<string, unknown>;
  metrics: Record<string, unknown>;
}) {
  return `
You are assisting a licensed broker with neighborhood intelligence.

Rules:
- Summarize neighborhood strengths, risks, and investment character.
- Be cautious if data is thin (e.g. low comparableCount or lowConfidence).
- Do not claim guaranteed returns or certainty when metrics are sparse.
- Explain what the scores likely reflect given the inputs (not ground truth).

Neighborhood: ${input.neighborhoodName}
City: ${input.city}

Scores:
${JSON.stringify(input.scores, null, 2)}

Metrics:
${JSON.stringify(input.metrics, null, 2)}

Return JSON:
{
  "summary": "",
  "strengths": [],
  "risks": [],
  "investorAngle": ""
}
`;
}
