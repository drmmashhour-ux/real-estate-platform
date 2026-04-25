import type { InvestorQaCategory, InvestorQaQuestion } from "./investor-qa.types";

const mk = (q: InvestorQaQuestion) => q;

/**
 * Québec + startup reality, compliance-first. Numbers are examples — founders should replace with real data.
 */
export const INVESTOR_QA_QUESTIONS: InvestorQaQuestion[] = [
  mk({
    id: "m-why-qc",
    category: "market",
    question: "Why Québec first?",
    keyPoints: [
      "concentrated",
      "regulatory clarity path",
      "bilingual GTM",
      "depth before breadth",
    ],
    modelAnswer:
      "We start in Québec to earn depth: one legal frame, one broker motion, and measurable proof. It lets us harden the product and compliance before we duplicate playbooks. Once repeatability is clear, we expand using the same infrastructure—not a scattershot launch.",
  }),
  mk({
    id: "m-tam",
    category: "market",
    question: "How big is the market?",
    keyPoints: [
      "define segment",
      "bottom-up or proxy",
      "realistic not hype",
    ],
    modelAnswer:
      "We size the reachable slice we can serve in 24–36 months—transaction volume, broker tooling spend, and adjacent services—using public stats plus our pipeline, not a fantasy TAM. The point is a credible path to a venture-scale outcome, not a headline number.",
  }),
  mk({
    id: "p-moat",
    category: "product",
    question: "What stops others from copying you?",
    keyPoints: [
      "workflow + data + trust",
      "not a thin ChatGPT",
      "rules and audits",
    ],
    modelAnswer:
      "A wrapper on generic models is easy to copy. We combine locked workflows, versioned deal logic, audit trails, and market-specific playbooks that must run safely in production. The moat is **systems + trust**, not a prompt.",
  }),
  mk({
    id: "p-generic-ai",
    category: "product",
    question: "Why not just use generic AI?",
    keyPoints: [
      "safety and structure",
      "domain constraints",
      "human-in-the-loop",
    ],
    modelAnswer:
      "Generic AI is unbounded. We use AI **inside** hard rails: schema-locked forms, non-bypassable checks, and compliance-aware flows so outputs are reviewable. The product is *assistive*—it doesn’t replace licensed judgment.",
  }),
  mk({
    id: "l-regulator",
    category: "legal",
    question: "Are you approved by the regulator?",
    keyPoints: [
      "no false approval claims",
      "assistive positioning",
      "counsel and evolution",
    ],
    modelAnswer:
      "We don’t market ‘regulator approval’ for the platform as a product category. We build assistive software; obligations sit with licensed professionals and evolve with counsel. We’re explicit about what the software is—and isn’t.",
  }),
  mk({
    id: "l-liability",
    category: "legal",
    question: "What's your liability?",
    keyPoints: [
      "ToS and scope",
      "insurance as operator matures",
      "clear limitations",
    ],
    modelAnswer:
      "Contracts scope us as a software provider with clear limitations; professionals remain responsible for advice and decisions. We’ll extend insurance and governance as we scale, aligned with what counsel and carriers require in each market.",
  }),
  mk({
    id: "t-users",
    category: "traction",
    question: "How many users or brokers do you have?",
    keyPoints: [
      "actual numbers or pilot stage",
      "definition of active",
      "pipeline honesty",
    ],
    modelAnswer:
      "We report what we can prove: active accounts, paid pilots, or LOI-backed cohorts. If we’re pre-scale, we say so and show leading indicators—repeat usage, retention in a wedge, and revenue proof—not vanity signups.",
  }),
  mk({
    id: "t-revenue",
    category: "traction",
    question: "Any revenue yet?",
    keyPoints: [
      "MRR/ARR or pilot revenue",
      "path to paid",
    ],
    modelAnswer:
      "We separate pilot usage from paid contracts. The story is a believable line from first dollars to repeat purchases—whether that’s small ARR now or a signed path with clear next milestones.",
  }),
  mk({
    id: "g-acquire",
    category: "gtm",
    question: "How will you acquire brokers at scale?",
    keyPoints: [
      "wedge and ICP",
      "channels with CAC thought",
      "referrals and product-led",
    ],
    modelAnswer:
      "We start with a tight ICP—teams we can win fast—using founder-led sales, partners, and product-led touchpoints, then layer scalable channels once the playbook works. GTM is sequenced, not a billboard on day one.",
  }),
  mk({
    id: "r-adoption",
    category: "risk",
    question: "What if brokers don’t adopt?",
    keyPoints: [
      "pivot or segment shift",
      "reduce friction",
      "proof from wedge",
    ],
    modelAnswer:
      "We validate adoption with a narrow cohort first. If pull is weak, we change packaging, ICP, or the wedge until usage compounds—backed by evidence, not hope.",
  }),
  mk({
    id: "r-ai-mistake",
    category: "risk",
    question: "What if AI makes a mistake?",
    keyPoints: [
      "guardrails and fallbacks",
      "human review",
      "insurance and process",
    ],
    modelAnswer:
      "We assume models err: locked schemas, validation gates, fallbacks, and human review for high-stakes steps. The product is designed so mistakes are *caught* and *bounded*, not silently shipped as truth.",
  }),
];

const BY_ID = new Map(INVESTOR_QA_QUESTIONS.map((q) => [q.id, q]));
const BY_CATEGORY = (cat: InvestorQaCategory) => INVESTOR_QA_QUESTIONS.filter((q) => q.category === cat);

export function getAllInvestorQaQuestions(): InvestorQaQuestion[] {
  return INVESTOR_QA_QUESTIONS;
}

export function getQuestionById(id: string): InvestorQaQuestion | undefined {
  return BY_ID.get(id);
}

export function getQuestionsByCategory(category: InvestorQaCategory): InvestorQaQuestion[] {
  return BY_CATEGORY(category);
}

export function pickRandomQuestion(excludeId?: string): InvestorQaQuestion {
  const pool = excludeId
    ? INVESTOR_QA_QUESTIONS.filter((q) => q.id !== excludeId)
    : INVESTOR_QA_QUESTIONS;
  if (!pool.length) return INVESTOR_QA_QUESTIONS[0]!;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickRandomBatch(n: number, excludeIds: Set<string> = new Set()): InvestorQaQuestion[] {
  const shuffled = [...INVESTOR_QA_QUESTIONS].filter((q) => !excludeIds.has(q.id)).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
