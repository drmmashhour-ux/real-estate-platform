import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type ReadinessLevel = "strong" | "moderate" | "needs_review";

export function humanizeUnderscores(s: string): string {
  return s
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Heuristic: hide internal-looking warning lines in client mode. */
export function filterClientFacingWarnings(warnings: string[]): string[] {
  return warnings.filter((w) => {
    const t = w.trim();
    if (!t) return false;
    if (/^[A-Z0-9_]{3,}$/.test(t)) return false;
    if (/knowledge_rule|section_key|graph_issue|internal/i.test(t)) return false;
    return true;
  });
}

export function clientRiskSummary(riskLevel: string): string {
  const r = riskLevel.toLowerCase();
  if (r.includes("high")) return "Higher uncertainty in this model";
  if (r.includes("low")) return "Lower indicated risk in this model";
  return "Moderate — confirm with your advisor";
}

export function readinessLevel(dto: OfferStrategyPublicDto): ReadinessLevel {
  const c = dto.confidenceLevel.toLowerCase();
  const r = dto.riskLevel.toLowerCase();
  if (r.includes("high") || c.includes("low")) return "needs_review";
  if (c.includes("high") && !r.includes("high")) return "strong";
  return "moderate";
}

export function readinessPhrase(level: ReadinessLevel): string {
  switch (level) {
    case "strong":
      return "Signals align reasonably well for a conversation with your broker.";
    case "moderate":
      return "Reasonable to discuss with conditions; verify facts before you commit.";
    default:
      return "Extra time to clarify documents and terms is appropriate before committing.";
  }
}

export function nextStepPlain(dto: OfferStrategyPublicDto): string {
  const level = readinessLevel(dto);
  const fw = filterClientFacingWarnings(dto.warnings);
  if (fw.length) return "Review the points noted below with your broker or lawyer before making an offer.";
  if (level === "needs_review") return "Ask for missing documents or clarifications before finalizing numbers.";
  return "Discuss the suggested range and conditions with your representative.";
}

export function scenarioTitle(strategyMode: string, dto: OfferStrategyPublicDto | null): string {
  const mode = humanizeUnderscores(strategyMode || "scenario");
  if (!dto) return `${mode} — offer scenario`;
  return `${mode} · ${humanizeUnderscores(dto.offerPosture)}`;
}

export function formatPriceRangeLine(
  min: number | null,
  target: number | null,
  max: number | null,
): { line: string; hasNumbers: boolean } {
  if (target == null) {
    return { line: "A numeric offer range is not available from current listing data.", hasNumbers: false };
  }
  const fmt = (c: number) => `$${(c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const low = min != null ? fmt(min) : null;
  const mid = fmt(target);
  const high = max != null ? fmt(max) : null;
  if (low && high) return { line: `Illustrative range: ${low} → ${mid} → ${high}`, hasNumbers: true };
  if (low) return { line: `Illustrative range from ${low} toward ${mid}`, hasNumbers: true };
  if (high) return { line: `Illustrative range around ${mid} up to ${high}`, hasNumbers: true };
  return { line: `Illustrative anchor: ${mid}`, hasNumbers: true };
}

export function summaryPlain(dto: OfferStrategyPublicDto): string {
  const parts: string[] = [];
  parts.push(`This scenario uses a ${humanizeUnderscores(dto.offerBand)} band.`);
  parts.push(`Overall confidence in this illustration: ${humanizeUnderscores(dto.confidenceLevel)}.`);
  if (dto.explanation?.trim()) {
    parts.push(dto.explanation.trim());
  }
  return parts.join(" ");
}
