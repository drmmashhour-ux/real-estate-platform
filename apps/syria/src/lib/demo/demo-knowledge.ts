/**
 * Static investor-demo knowledge only — no DB, no runtime user data.
 * Used for safe QA fallback and as optional context for demo AI (server-side).
 */

export type DemoKnowledgeTopic = {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
};

export const DEMO_KNOWLEDGE_TOPICS: DemoKnowledgeTopic[] = [
  {
    id: "platform",
    title: "SYBNB marketplace",
    summary:
      "SYBNB is Darlink’s short-stay marketplace slice: listings are gated for trust and safety before they surface broadly in browse. Host and listing signals feed ranking and visibility so operators can showcase quality inventory without exposing risky inventory to guests.",
    keywords: [
      "platform",
      "sybnb",
      "marketplace",
      "listing",
      "browse",
      "darlink",
      "inventory",
      "host",
      "rank",
      "trust",
    ],
  },
  {
    id: "payments",
    title: "Payment safety (demo)",
    summary:
      "In investor demo mode, real card charges and production payouts are blocked by design. Payments use stubbed or sandbox-safe paths so investors can review flows without financial exposure. Never assume demo behaviour matches production payment rails.",
    keywords: [
      "payment",
      "pay",
      "card",
      "stripe",
      "charge",
      "sandbox",
      "stub",
      "demo",
      "money",
      "payout",
      "financial",
    ],
  },
  {
    id: "drbrain",
    title: "Dr. Brain",
    summary:
      "Dr. Brain is an operator-facing intelligence surface that highlights anomalies and operational signals from syndicated metrics — simulated or demo-scoped in investor demos. It does not expose raw customer secrets and should not be treated as production alerting.",
    keywords: [
      "dr brain",
      "dr.",
      "brain",
      "monitor",
      "anomaly",
      "operator",
      "dashboard",
      "kpi",
      "alert",
    ],
  },
  {
    id: "escrow",
    title: "Escrow-style protections",
    summary:
      "The demo narrative describes staged releases and dispute-aware flows typical of marketplace protections. Exact legal escrow terms vary by jurisdiction and product — here we illustrate concepts only: holds, release checks, and dispute pathways without binding legal promises.",
    keywords: [
      "escrow",
      "hold",
      "release",
      "dispute",
      "refund",
      "protection",
      "stage",
    ],
  },
  {
    id: "fraud",
    title: "Fraud detection",
    summary:
      "Fraud and abuse signals combine booking behaviour, identity/trust tiers, and rule-based checks before risky actions complete. In demo, signals may be synthetic — the goal is to show how layered checks reduce abuse without displaying sensitive fraud-team internals.",
    keywords: [
      "fraud",
      "abuse",
      "risk",
      "signal",
      "verification",
      "identity",
      "booking",
      "scam",
    ],
  },
];

/** Single block for optional AI context — no secrets, static copy only. */
export function getDemoKnowledgeContextBlock(): string {
  return DEMO_KNOWLEDGE_TOPICS.map((t) => `## ${t.title}\n${t.summary}`).join("\n\n");
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "does",
  "do",
  "can",
  "could",
  "about",
  "this",
  "that",
  "with",
  "for",
  "and",
  "or",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Deterministic answer from the knowledge base — no network calls.
 */
export function answerFromKnowledgeBase(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return "Please enter a question about the demo.";
  }

  const qTokens = new Set(tokenize(trimmed));
  if (qTokens.size === 0) {
    return (
      "Ask about the marketplace, payment safety in demo, Dr. Brain, escrow-style protections, or fraud detection — " +
      "answers use demo-safe summaries only."
    );
  }

  let best: { topic: DemoKnowledgeTopic; score: number } | null = null;

  for (const topic of DEMO_KNOWLEDGE_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      const kwNorm = kw.toLowerCase();
      if (trimmed.toLowerCase().includes(kwNorm)) {
        score += 3;
      }
      for (const part of kwNorm.split(/\s+/)) {
        if (part.length > 2 && qTokens.has(part)) score += 1;
      }
    }
    if (!best || score > best.score) {
      best = { topic, score };
    }
  }

  if (best && best.score >= 2) {
    return `${best.topic.title}: ${best.topic.summary}`;
  }

  return (
    "I only answer using demo-safe summaries (no live accounts or secrets). " +
    "Try asking about: the SYBNB marketplace, payment safety in demo, Dr. Brain, escrow-style protections, or fraud detection."
  );
}
