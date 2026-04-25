export function buildDigestPrompt(data: unknown): string {
  const d = data as { meta?: { digestUsesIncompleteMarketData?: boolean; window?: { label?: string } } };
  const thin = d.meta?.digestUsesIncompleteMarketData
    ? "DATA_QUALITY: incomplete or thin market coverage — label uncertainty; do not invent regional statistics."
    : "DATA_QUALITY: market snapshots present — still avoid over-precision.";

  return `
You are generating a daily executive real estate briefing for LECIPM (advisory only).

Rules:
- Summarize clearly: platform activity, pipeline deals, saved-search / buy-box style updates, alerts, watchlist motion, portfolio + autopilot signals, market zones / heat.
- Highlight important changes since the time window in meta.window.
- Identify risks and opportunities grounded ONLY in DATA.
- Suggest practical next actions a human can take (no autonomous execution language).
- If meta.digestUsesIncompleteMarketData is true, state that briefing uses "Platform + partial market data" and avoid definitive pricing conclusions.
- Never use guaranteed returns, "risk-free", or certainty of outcomes.

${thin}

DATA:
${JSON.stringify(data, null, 2)}

Return JSON only (no markdown fences) with this shape:
{
  "summary": "",
  "keyHighlights": [],
  "risks": [],
  "opportunities": [],
  "suggestedActions": [],
  "metrics": {}
}
`.trim();
}
