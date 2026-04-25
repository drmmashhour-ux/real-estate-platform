import { messagingAiLog } from "@/modules/messaging/assistant/messaging-ai-logger";

export type ObjectionType =
  | "price"
  | "timing"
  | "financing"
  | "location"
  | "property_fit"
  | "trust"
  | "competition"
  | "other";

export type ClassifiedObjection = {
  type: ObjectionType;
  /** 0–1; capped when evidence is weak */
  confidence: number;
  evidence: string[];
  severity: "low" | "medium" | "high";
};

export type ObjectionClassifierResult = {
  objections: ClassifiedObjection[];
  dominantObjection: string | null;
};

const MAX_SNIPPET = 120;

export type ClassifierMessage = {
  body: string;
  /** Optional — when set, can weight counterparty text higher */
  senderId?: string;
  counterpartyId?: string;
};

const NEG_RE = /\b(not|no|isn'?t|aren'?t|without|deny|doubt|never|hardly|barely)\b/i;

function isNegatedNear(text: string, idx: number, window = 32): boolean {
  const w = text.slice(Math.max(0, idx - window), Math.min(text.length, idx + 8));
  return NEG_RE.test(w);
}

const RULES: {
  type: ObjectionType;
  re: RegExp;
  minConf: number;
}[] = [
  { type: "price", re: /\b(too )?expens(ive|e)|overpriced|pricey|out of (my )?budget|can('?t )?afford|too much money|lowball|discount\b/i, minConf: 0.55 },
  { type: "timing", re: /\bnot ready( yet)?|need time|(?:too )?soon|later|next year|wait(ing)?|rushed|hurry|delay\b/i, minConf: 0.5 },
  { type: "financing", re: /\bmortgage|pre[- ]?approval|loan|lender|financ(e|ing|able)|appraisal|down payment|credit( score)?|bank\b/i, minConf: 0.5 },
  { type: "location", re: /\b(too )?far|neighborhood|commute|transit|school district|noisy|busy street|location\b|area( is| feels)?/i, minConf: 0.5 },
  { type: "property_fit", re: /\bnot enough (room|bed|bath|space)|too small|layout|doesn'?t (fit|work)|not (our|my) style|old|needs (too much )?work|reno(vation|)/i, minConf: 0.55 },
  { type: "trust", re: /\bscam|distrust|worried about|hidden|transparent|reputable|is this (safe|legit|real)\?/i, minConf: 0.5 },
  { type: "competition", re: /\bother offer|bidding( war)?|someone else|comparing|another place|saw a (better|cheaper)/i, minConf: 0.5 },
];

/**
 * Deterministic, keyword-first objection candidates. Low evidence → lower confidence. Not legal or financial advice.
 */
export function classifyObjections(
  messages: ClassifierMessage[],
  opts?: { maxEvidence?: number }
): ObjectionClassifierResult {
  const maxE = opts?.maxEvidence ?? 3;
  try {
    const blobs: { text: string; weight: number }[] = [];
    for (const m of messages) {
      if (!m.body || !m.body.trim()) continue;
      const t = m.body.slice(-2000);
      const cp = m.senderId && m.counterpartyId && m.senderId === m.counterpartyId;
      const weight = cp ? 1 : 0.6;
      blobs.push({ text: t, weight });
    }
    if (blobs.length === 0) {
      messagingAiLog.objectionsClassified({ count: 0, reason: "no_text" });
      return { objections: [], dominantObjection: null };
    }

    const found = new Map<ObjectionType, { score: number; evidence: string[] }>();
    for (const { text, weight } of blobs) {
      for (const rule of RULES) {
        const matches = text.matchAll(new RegExp(rule.re.source, "gi"));
        for (const m of matches) {
          if (!m[0] || m.index == null) continue;
          // "not ready" is a timing concern, not a negation to discard.
          const isNotReadyTiming = rule.type === "timing" && /\bnot ready\b/i.test(m[0]);
          if (!isNotReadyTiming && isNegatedNear(text, m.index, 40)) continue;
          const ex = m[0].slice(0, MAX_SNIPPET);
          if (!ex.trim()) continue;
          const add = (rule.minConf * weight) / 1.2;
          const cur = found.get(rule.type) ?? { score: 0, evidence: [] as string[] };
          cur.score += add;
          if (cur.evidence.length < maxE) cur.evidence.push(ex);
          found.set(rule.type, cur);
        }
      }
    }

    const objections: ClassifiedObjection[] = [];
    for (const [type, v] of found) {
      const confRaw = Math.min(0.95, 0.25 + v.score * 0.35);
      const confidence = Math.round(confRaw * 100) / 100;
      const n = v.evidence.length;
      const severity: ClassifiedObjection["severity"] =
        confidence < 0.4 ? "low" : confidence < 0.65 && n < 2 ? "medium" : n >= 2 && confidence >= 0.5 ? "high" : "medium";
      if (v.evidence.length > 0) {
        objections.push({ type, confidence, evidence: [...new Set(v.evidence)].slice(0, maxE), severity });
      }
    }
    objections.sort((a, b) => b.confidence - a.confidence);

    let dominantObjection: string | null = null;
    if (objections[0] && objections[0].evidence.length > 0) {
      dominantObjection = objections[0]!.type;
    }

    messagingAiLog.objectionsClassified({ count: objections.length, dominant: dominantObjection });
    return { objections, dominantObjection };
  } catch (e) {
    messagingAiLog.warn("objections_classify_error", { err: e instanceof Error ? e.message : String(e) });
    return { objections: [], dominantObjection: null };
  }
}
