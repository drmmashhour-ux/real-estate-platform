/**
 * Strip internal-only language from investor dashboard payloads — public share must never echo admin/debug lines.
 */

import type { InvestorDashboard, InvestorMetric, InvestorNarrative, InvestorSection } from "@/modules/investors/investor-dashboard.types";
import type { InvestorShareVisibility } from "@/modules/investors/investor-share.types";

const INTERNAL_PATTERNS =
  /\b(Growth Machine|execution planner|FEATURE_|operator telemetry|internal tool|admin panel|sparse.*telemetry|broker-tier rows|CRM rows unlocked|idempotency|\/api\/|prisma|postgres)/i;

/** UUID / CUID-style ids — never echo on public share surface. */
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const CUID_LIKE_RE = /\bc[a-z0-9]{24}\b/gi;

/** Strip identifiers and noisy internals from any investor-facing string. */
export function scrubInvestorShareText(s: string): string {
  let t = s.replace(UUID_RE, "").replace(CUID_LIKE_RE, "");
  t = t.replace(/\b(clx|cus|txn)_[a-z0-9_]{6,}\b/gi, "");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function neutralizeProductCopy(s: string): string {
  return s
    .replace(/Fast Deal/gi, "Market bundle")
    .replace(/\bCRM\b/g, "pipeline")
    .replace(/not investment advice/gi, "not personalized investment advice");
}

/** Lines dropped entirely for external readers. */
function sanitizeLines(lines: string[]): string[] {
  return lines
    .map((line) => scrubInvestorShareText(neutralizeProductCopy(line.trim())))
    .filter((line) => line.length > 0)
    .filter((line) => !INTERNAL_PATTERNS.test(line))
    .map((line) => line.replace(/\s+/g, " ").slice(0, 1200));
}

function sanitizeParagraph(text: string): string {
  const parts = text.split(/\n/).map((p) => p.trim()).filter(Boolean);
  return sanitizeLines(parts).join("\n");
}

function sanitizeWarnings(warnings: string[]): string[] {
  const out: string[] = [];
  for (const w of warnings) {
    if (INTERNAL_PATTERNS.test(w)) continue;
    const n = scrubInvestorShareText(
      neutralizeProductCopy(w).replace(/Fast Deal/g, "Market activity index"),
    ).slice(0, 500);
    if (INTERNAL_PATTERNS.test(n)) continue;
    if (n.length > 12) out.push(n);
  }
  return [...new Set(out)].slice(0, 12);
}

function sanitizeMetric(m: InvestorMetric): InvestorMetric {
  const label = scrubInvestorShareText(neutralizeProductCopy(m.label)).slice(0, 200) || "Indicator";
  const value = scrubInvestorShareText(m.value).slice(0, 120) || "—";
  return {
    ...m,
    label,
    value,
    change: m.change
      ? scrubInvestorShareText(neutralizeProductCopy(m.change).replace(/vs prior \d+d/g, "vs prior period")).slice(0, 200) || undefined
      : undefined,
    period: scrubInvestorShareText(m.period).slice(0, 80) || "Recent window",
    /** Keep confidence tier — investor-appropriate label. */
    confidence: m.confidence,
  };
}

function emptyNarrative(): InvestorNarrative {
  return {
    headline: "",
    summary: "",
    growthStory: [],
    executionProof: [],
    expansionStory: [],
    risks: [],
    outlook: [],
  };
}

export function filterInvestorDashboardForShare(
  internal: InvestorDashboard,
  visibility: InvestorShareVisibility,
): {
  metrics: InvestorMetric[];
  narrative: InvestorNarrative;
  sections: InvestorSection[];
  warnings: string[];
} {
  const metrics = visibility.metrics ? internal.metrics.map(sanitizeMetric) : [];

  const n: InvestorNarrative = emptyNarrative();
  if (visibility.narrative) {
    n.headline = sanitizeParagraph(internal.narrative.headline);
    n.summary = sanitizeParagraph(internal.narrative.summary);
    n.growthStory = sanitizeLines(internal.narrative.growthStory);
  }
  if (visibility.executionProof) {
    n.executionProof = sanitizeLines(internal.narrative.executionProof);
  }
  if (visibility.expansionStory) {
    n.expansionStory = sanitizeLines(internal.narrative.expansionStory);
  }
  if (visibility.risks) {
    n.risks = sanitizeLines(internal.narrative.risks);
  }
  if (visibility.outlook) {
    n.outlook = sanitizeLines(internal.narrative.outlook);
  }

  const mergedWarnings = [...internal.meta.warnings, ...mapMissingAreas(internal.meta.missingDataAreas)];
  const showWarnings = visibility.risks || visibility.metrics;
  const warnings = showWarnings ? sanitizeWarnings(mergedWarnings) : [];

  const sections: InvestorSection[] = [];
  for (const s of internal.sections) {
    if (s.title === "Key metrics" && !visibility.metrics) continue;
    if (s.title === "Growth narrative" && !visibility.narrative) continue;
    if (s.title === "Execution proof" && !visibility.executionProof) continue;
    if (s.title === "Expansion strategy" && !visibility.expansionStory) continue;
    if (s.title === "Risks & warnings" && !visibility.risks) continue;
    if (s.title === "Outlook" && !visibility.outlook) continue;
    sections.push({
      title: mapSectionTitle(s.title),
      type: s.type,
      content: sanitizeParagraph(s.content),
    });
  }

  return { metrics, narrative: n, sections, warnings };
}

function mapSectionTitle(t: string): string {
  return scrubInvestorShareText(
    neutralizeProductCopy(t).replace(/Fast Deal/gi, "Market comparison").replace(/\bCRM\b/g, "Pipeline"),
  ).slice(0, 120);
}

function mapMissingAreas(areas: string[]): string[] {
  const out: string[] = [];
  let otherGap = false;
  for (const a of areas) {
    if (/city comparison/i.test(a)) out.push("Geographic comparison data was limited for this period.");
    else if (/Revenue illustration/i.test(a)) out.push("Illustrative revenue range was not shown due to limited pipeline history.");
    else if (/accountability/i.test(a)) out.push("Execution checklist signals were sparse — treat directional metrics cautiously.");
    else if (a.length > 8 && !INTERNAL_PATTERNS.test(a)) otherGap = true;
  }
  if (otherGap) {
    out.push("Some supporting signals were incomplete for this period — treat directional metrics cautiously.");
  }
  return [...new Set(out)];
}
