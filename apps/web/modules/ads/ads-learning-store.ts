/**
 * In-process learning hints for ads copy + automation loop — not a database; resets on deploy.
 * Safe: no spend, no external APIs.
 */

export type ObjectiveSegmentKey = "lead" | "booking" | "host_acquisition" | "mixed";

export type AdsLearningSnapshot = {
  winningHeadlines: string[];
  losingHeadlines: string[];
  bestAudiences: string[];
  highPerformingHooks: string[];
  lowPerformingHooks: string[];
  weakAudiences: string[];
  bestCtaPhrases: string[];
  weakCtaPhrases: string[];
  /** Best campaign objective label per coarse segment (heuristic memory). */
  bestObjectiveBySegment: { segment: ObjectiveSegmentKey; objective: string }[];
};

const MAX_EACH = 24;
const MAX_OBJECTIVE_ROWS = 12;

const store: AdsLearningSnapshot = {
  winningHeadlines: [],
  losingHeadlines: [],
  bestAudiences: [],
  highPerformingHooks: [],
  lowPerformingHooks: [],
  weakAudiences: [],
  bestCtaPhrases: [],
  weakCtaPhrases: [],
  bestObjectiveBySegment: [],
};

function pushUnique(arr: string[], line: string, max: number) {
  const t = line.trim();
  if (!t || arr.includes(t)) return;
  arr.unshift(t);
  while (arr.length > max) arr.pop();
}

/** Seed defaults so first run has bias toward proven LECIPM angles. */
function ensureSeed() {
  if (store.winningHeadlines.length === 0) {
    store.winningHeadlines.push(
      "Verified stays in Montréal — book with confidence",
      "Smarter short-term rentals on LECIPM",
    );
  }
  if (store.bestAudiences.length === 0) {
    store.bestAudiences.push("Travel intent · Montréal +25km", "Retargeting · site visitors 30d");
  }
  if (store.highPerformingHooks.length === 0) {
    store.highPerformingHooks.push("Still comparing stays?", "Your dates, verified hosts");
  }
  if (store.bestCtaPhrases.length === 0) {
    store.bestCtaPhrases.push("See availability", "Get the guide");
  }
  if (store.bestObjectiveBySegment.length === 0) {
    store.bestObjectiveBySegment.push(
      { segment: "booking", objective: "Traffic + conversion — BNHub inventory" },
      { segment: "lead", objective: "Lead gen — CRM-backed follow-up" },
    );
  }
}

export function getAdsLearningStore(): Readonly<AdsLearningSnapshot> {
  ensureSeed();
  return {
    winningHeadlines: [...store.winningHeadlines],
    losingHeadlines: [...store.losingHeadlines],
    bestAudiences: [...store.bestAudiences],
    highPerformingHooks: [...store.highPerformingHooks],
    lowPerformingHooks: [...store.lowPerformingHooks],
    weakAudiences: [...store.weakAudiences],
    bestCtaPhrases: [...store.bestCtaPhrases],
    weakCtaPhrases: [...store.weakCtaPhrases],
    bestObjectiveBySegment: store.bestObjectiveBySegment.map((r) => ({ ...r })),
  };
}

export function recordWinningHeadline(line: string) {
  ensureSeed();
  pushUnique(store.winningHeadlines, line, MAX_EACH);
}

export function recordLosingHeadline(line: string) {
  ensureSeed();
  pushUnique(store.losingHeadlines, line, MAX_EACH);
}

export function recordBestAudience(label: string) {
  ensureSeed();
  pushUnique(store.bestAudiences, label, MAX_EACH);
}

export function recordHighPerformingHook(line: string) {
  ensureSeed();
  pushUnique(store.highPerformingHooks, line, MAX_EACH);
}

export function recordLowPerformingHook(line: string) {
  ensureSeed();
  pushUnique(store.lowPerformingHooks, line, MAX_EACH);
}

export function recordWeakAudience(label: string) {
  ensureSeed();
  pushUnique(store.weakAudiences, label, MAX_EACH);
}

export function recordBestCtaPhrase(line: string) {
  ensureSeed();
  pushUnique(store.bestCtaPhrases, line, MAX_EACH);
}

export function recordWeakCtaPhrase(line: string) {
  ensureSeed();
  pushUnique(store.weakCtaPhrases, line, MAX_EACH);
}

export function recordBestObjectiveForSegment(segment: ObjectiveSegmentKey, objective: string) {
  ensureSeed();
  const o = objective.trim();
  if (!o) return;
  const idx = store.bestObjectiveBySegment.findIndex((x) => x.segment === segment);
  if (idx >= 0) {
    store.bestObjectiveBySegment[idx] = { segment, objective: o };
  } else {
    store.bestObjectiveBySegment.unshift({ segment, objective: o });
    while (store.bestObjectiveBySegment.length > MAX_OBJECTIVE_ROWS) store.bestObjectiveBySegment.pop();
  }
}

/** Fold optimizer output into memory — only promotes test/scale ideas; pause does not poison winners. */
export function ingestOptimizerLearning(input: {
  improvedHeadlines?: string[];
  recommendation: "scale" | "pause" | "test_variation";
}) {
  ensureSeed();
  if (input.recommendation === "pause") return;
  for (const h of input.improvedHeadlines ?? []) {
    recordWinningHeadline(h);
  }
}

/** Merge durable learning strings without clearing the in-memory store (hybrid hydration). */
export function mergeExternalLearningLines(
  lines: string[],
  kind: "high_hook" | "low_hook" | "best_cta" | "weak_cta" | "best_audience" | "weak_audience",
) {
  ensureSeed();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    switch (kind) {
      case "high_hook":
        recordHighPerformingHook(line);
        break;
      case "low_hook":
        recordLowPerformingHook(line);
        break;
      case "best_cta":
        recordBestCtaPhrase(line);
        break;
      case "weak_cta":
        recordWeakCtaPhrase(line);
        break;
      case "best_audience":
        recordBestAudience(line);
        break;
      case "weak_audience":
        recordWeakAudience(line);
        break;
    }
  }
}
