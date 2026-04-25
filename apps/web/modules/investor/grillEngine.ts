/**
 * InvestorGrillLive — real-time “pressure” question engine for LECIPM.
 * Rule-based: personas + mode shape tone, interruption rate, and timer budgets.
 */

export type GrillMode = "warmup" | "standard" | "hardcore";

export type PersonaId = "vc" | "angel" | "skeptic" | "legal";

export type QuestionType = "interruption" | "followup" | "challenge" | "objection";

export type PitchPhase = "opening" | "product" | "traction" | "moat" | "risk" | "close";

export type GrillQuestion = {
  id: string;
  /** Shown in UI */
  type: QuestionType;
  phase: PitchPhase;
  /** Who can ask: `all` = any investor */
  persona: PersonaId | "all";
  text: string;
  keyPoints: string[];
  modelAnswer: string;
  tags?: string[];
};

export type GrillContext = {
  mode: GrillMode;
  personaId: PersonaId;
  pitchPhase: PitchPhase;
  turnIndex: number;
  previousAnswer?: string;
  previousScore?: number;
  weakAreas: string[];
  lastQuestionId?: string;
  /** 0–1, increases when user scores low; drives harder phrasing in hardcore */
  pressureLevel: number;
};

const PHASE_ORDER: PitchPhase[] = [
  "opening",
  "product",
  "traction",
  "moat",
  "risk",
  "close",
];

const INTERRUPT_WARM: string[] = [
  "Hold on—one thing before you continue.",
  "Sorry to cut in, but I need clarity on this part.",
  "Let me press you on that for a second.",
];

const INTERRUPT_STRONG: string[] = [
  "Stop. I don’t buy that yet—",
  "I’m going to interrupt you there.",
  "That doesn’t land. Back up and—",
  "I don’t believe that—prove it.",
  "We’re not aligned—justify this:",
];

const DISAGREE_PREFIX: string[] = [
  "I disagree. ",
  "That sounds hand-wavy. ",
  "I’m skeptical. ",
  "I’ve heard this story before. ",
];

export const INVESTOR_PERSONAS: Record<
  PersonaId,
  { name: string; label: string; blurb: string; askStyle: string }
> = {
  vc: {
    name: "VC Partner",
    label: "Scale & moat",
    blurb: "Cares about defensibility, TAM, and how this compounds.",
    askStyle: "Direct, numbers-forward, time-boxed follow-ups.",
  },
  angel: {
    name: "Angel investor",
    label: "Clarity & traction",
    blurb: "Cares that you can explain the thing simply and show early proof.",
    askStyle: "Plain language, founder empathy, but still sharp.",
  },
  skeptic: {
    name: "Skeptical operator",
    label: "Execution reality",
    blurb: "Challenges every assumption; treats slides as optional.",
    askStyle: "Interrupts, demands concrete examples, hates buzzwords.",
  },
  legal: {
    name: "Legal / compliance mind",
    label: "Risk & liability",
    blurb: "Focuses on regulatory surface area, who carries risk, and what breaks.",
    askStyle: "Precision; pins down edge cases and disclosure duties.",
  },
};

/**
 * LECIPM-anchored + generic founder practice bank.
 * (IDs stable for analytics / retry.)
 */
export const GRILL_QUESTION_BANK: GrillQuestion[] = [
  {
    id: "stop_why_broker",
    type: "interruption",
    phase: "product",
    persona: "all",
    text: "Stop. Why would a broker use this instead of their current tools?",
    keyPoints: [
      "Specific pain today (time, compliance, lead quality)",
      "Differentiated workflow vs generic office stack",
      "Measurable outcome for the desk",
    ],
    modelAnswer:
      "Generic office tools and generic AI help with text, but they don’t enforce structure or OACIQ-style guardrails. We combine drafting with compliance-aware validation, so a broker can move faster without increasing regulatory exposure—that’s a different job than a chat prompt.",
    tags: ["value_prop", "brokers"],
  },
  {
    id: "why_not_chatgpt",
    type: "challenge",
    phase: "product",
    persona: "all",
    text: "Why not just use ChatGPT?",
    keyPoints: [
      "Generic text vs domain validation",
      "Structured output + review gates",
      "Regulated context needs traceability, not vibe",
    ],
    modelAnswer:
      "Generic AI generates text, but it doesn’t enforce structure or compliance. We combine AI with domain-specific validation, which is critical in regulated real-estate transactions—brokers need defensible outputs, not clever paragraphs.",
    tags: ["ai", "moat"],
  },
  {
    id: "moat_60s",
    type: "objection",
    phase: "moat",
    persona: "vc",
    text: "What’s the moat if OpenAI can ship a ‘real estate template’ next quarter?",
    keyPoints: [
      "Proprietary data / workflow integration",
      "Compliance and auditability as a product surface",
      "Distribution: brokers + marketplaces, not a wrapper",
    ],
    modelAnswer:
      "A template isn’t the product. The moat is the integration of decision logic, data signals, and compliance rails across a transaction flow, plus the distribution trust with working brokers. Anyone can show a form; we’re building the defensible system that sits on the path to money moving.",
    tags: ["moat", "ai"],
  },
  {
    id: "first_revenue_grill",
    type: "followup",
    phase: "traction",
    persona: "angel",
    text: "What’s your first revenue, and who pays first—and why this year?",
    keyPoints: [
      "Named segment",
      "Concrete payment trigger",
      "Why urgency exists now",
    ],
    modelAnswer:
      "The first check comes from high-intent transaction touchpoints: usage-based fees for compliance-heavy outputs where mistakes are expensive. We prioritize a narrow cohort of active brokers in-market so we can prove willingness-to-pay before we widen.",
    tags: ["traction", "gtm"],
  },
  {
    id: "law25_surface",
    type: "objection",
    phase: "risk",
    persona: "legal",
    text: "Where does liability sit if a draft is wrong—your platform, the broker, or the model vendor?",
    keyPoints: [
      "Clear human-in-the-loop position",
      "Not legal advice; disclosure posture",
      "Operational mitigations: logging, review gates",
    ],
    modelAnswer:
      "The broker remains responsible for professional advice; we provide software assistance with clear disclosures, audit trails, and review gates. We don’t present outputs as legal truth—we reduce operational risk and make review faster, with traceability for regulators and brokerages.",
    tags: ["compliance", "liability"],
  },
  {
    id: "prove_traction",
    type: "challenge",
    phase: "traction",
    persona: "skeptic",
    text: "Prove you’re not just building. What evidence do you have of pull?",
    keyPoints: [
      "A metric you can name",
      "A repeatable user behavior",
      "What you did last week to validate",
    ],
    modelAnswer:
      "Pull shows up as repeat usage on the same workflow and referrals inside brokerages—not a vanity funnel metric. I can point to weekly active desks and a rising completion rate on the highest-friction task we solve, because that’s the behavior money follows.",
    tags: ["traction"],
  },
  {
    id: "why_now",
    type: "followup",
    phase: "opening",
    persona: "all",
    text: "Why is this urgent now—what changed in the last 18 months?",
    keyPoints: [
      "A real shift (regulation, AI capability, market pressure)",
      "Consequence of waiting",
    ],
    modelAnswer:
      "Regulatory pressure and privacy expectations are rising while transaction volumes demand speed. At the same time, AI is finally reliable enough for structured work—but only if it’s wrapped in reviewable, domain-specific validation. That window didn’t exist three years ago.",
    tags: ["market"],
  },
  {
    id: "overengineering",
    type: "interruption",
    phase: "product",
    persona: "skeptic",
    text: "This sounds overbuilt. Why not one app and ship faster?",
    keyPoints: [
      "Security / compliance boundaries",
      "Separation to reduce cross-risk",
      "What you gain vs complexity cost",
    ],
    modelAnswer:
      "It’s a separation of risk and velocity: the consumer path can move fast, while compliance-heavy operations stay isolated, auditable, and permissioned. We’re not optimizing for a single app icon—we’re optimizing for safe scale in a regulated market.",
    tags: ["architecture"],
  },
  {
    id: "tam_sanity",
    type: "challenge",
    phase: "opening",
    persona: "vc",
    text: "Walk me through TAM in one minute—bottom-up, not a headline slide.",
    keyPoints: [
      "A definable user base",
      "A realistic $/user or $/transaction",
      "A sanity check vs alternatives",
    ],
    modelAnswer:
      "Start with the number of active brokerage desks in our launch corridor, the fraction running digital workflows, and a conservative attach rate. Multiply by a fee tied to a high-frequency compliance step—not ‘all real estate’—and you get a TAM that’s narrow enough to be credible and large enough to matter.",
    tags: ["market"],
  },
  {
    id: "icp_crystal",
    type: "followup",
    phase: "opening",
    persona: "angel",
    text: "In one sentence: who is the customer on day one?",
    keyPoints: ["A role", "A situation", "A trigger"],
    modelAnswer:
      "Day-one customer is the busy professional broker who already closes deals and will pay to reduce drafting + compliance risk on every file—not a tourist founder browsing AI demos.",
    tags: ["gtm"],
  },
  {
    id: "competitive_kill",
    type: "objection",
    phase: "moat",
    persona: "skeptic",
    text: "A big portal copies your top feature. What actually dies first—you or them?",
    keyPoints: [
      "What they can’t copy quickly",
      "What you can ship while they meet internally",
    ],
    modelAnswer:
      "They can copy a feature; they can’t copy the speed of our iteration loop on broker workflows, the trust relationships in-channel, and the compliance posture that must match how brokers actually work. In this market, the risk is in moving slowly, not in a UI toggle.",
    tags: ["competition", "moat"],
  },
  {
    id: "data_governance",
    type: "objection",
    phase: "risk",
    persona: "legal",
    text: "What’s your data governance story under privacy law and brokerage duties?",
    keyPoints: [
      "Minimization / purpose limitation",
      "Access controls and retention",
      "Not selling sensitive insight casually",
    ],
    modelAnswer:
      "We collect what’s required to deliver the product, with role-based access, retention limits, and clear contracts. The posture is: enable the broker; don’t monetize by surprise on sensitive file content.",
    tags: ["privacy", "compliance"],
  },
  {
    id: "close_ask",
    type: "followup",
    phase: "close",
    persona: "all",
    text: "If we write a check, what is explicitly *not* on your roadmap for the next 6 months?",
    keyPoints: [
      "Ruthless focus",
      "What you will say no to",
    ],
    modelAnswer:
      "We’re not going to boil the ocean on consumer social features. The next six months are about a narrow workflow with measurable broker ROI, a tight compliance story, and repeatable adoption inside target brokerages—everything else waits.",
    tags: ["focus"],
  },
  {
    id: "unit_econ",
    type: "challenge",
    phase: "traction",
    persona: "vc",
    text: "Unit economics: what is your true gross margin *after* support and compliance cost?",
    keyPoints: [
      "A definition of “unit” (seat, file, deal)",
      "Variable vs fixed load",
    ],
    modelAnswer:
      "Our unit is a completed compliance-heavy file that triggers payment. Gross margin is healthy because software margins dominate after we pass a fixed support threshold—our job is to keep variable review cost predictable as volume scales.",
    tags: ["unit_economics", "traction"],
  },
  {
    id: "regulatory_change",
    type: "objection",
    phase: "risk",
    persona: "legal",
    text: "If a regulator changes a disclosure rule, how fast can you update production—and how do you prove you did?",
    keyPoints: ["Change management", "Audit trail", "User communication"],
    modelAnswer:
      "We version templates and gates, push updates in a traceable way, and keep broker-facing release notes. For audits, we can show what the user saw at export time, not what we wish they saw.",
    tags: ["compliance", "ops"],
  },
  {
    id: "nps_broker",
    type: "followup",
    phase: "product",
    persona: "angel",
    text: "What is the *one* workflow metric a head broker will actually feel in week 1?",
    keyPoints: ["Concrete workflow", "Measurable delta", "No vanity metric"],
    modelAnswer:
      "Time from intake to a review-ready draft, with a lower rework rate. If we can’t move that needle in a week, we don’t have product-market fit in that office.",
    tags: ["product", "traction"],
  },
];

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], seed: string, salt: string): T {
  const h = hashSeed(`${seed}::${salt}`);
  return arr[h % arr.length]!;
}

function randomChance(seed: string, t: number): number {
  const x = Math.sin(hashSeed(seed + String(t))) * 10000;
  return x - Math.floor(x);
}

export function secondsForMode(mode: GrillMode): { min: number; max: number } {
  switch (mode) {
    case "warmup":
      return { min: 18, max: 20 };
    case "standard":
      return { min: 12, max: 16 };
    case "hardcore":
      return { min: 10, max: 12 };
    default:
      return { min: 12, max: 16 };
  }
}

export function timeLimitSecondsForQuestion(mode: GrillMode, qid: string, turnIndex: number): number {
  const { min, max } = secondsForMode(mode);
  const r = randomChance(qid, turnIndex);
  const span = max - min + 1;
  return min + Math.floor(r * span);
}

export function phaseForTurn(turnIndex: number): PitchPhase {
  // ~1–2 questions per phase: compress into 6 phases for an 8–12 Q session, caller caps turns
  const idx = Math.min(PHASE_ORDER.length - 1, Math.floor(turnIndex / 1.4));
  return PHASE_ORDER[idx] ?? "close";
}

function personaMatchesRow(row: GrillQuestion, personaId: PersonaId): boolean {
  return row.persona === "all" || row.persona === personaId;
}

function withPressurePrefix(
  text: string,
  ctx: GrillContext,
  questionType: QuestionType,
): { displayText: string; pressureKind: "none" | "interrupt" | "disagree" } {
  const seed = `${ctx.personaId}-${ctx.mode}-${ctx.turnIndex}-${text.slice(0, 12)}`;
  const p = randomChance(seed, ctx.turnIndex);
  const hard = ctx.mode === "hardcore" || ctx.pressureLevel > 0.35;

  if (p < 0.08) {
    return { displayText: text, pressureKind: "none" };
  }

  if (questionType === "interruption" || (hard && p < 0.45)) {
    const pool = ctx.mode === "warmup" ? INTERRUPT_WARM : INTERRUPT_STRONG;
    const pre = pick(pool, seed, "int");
    return { displayText: `${pre} ${text}`, pressureKind: "interrupt" };
  }
  if (p < 0.6 && (questionType === "objection" || questionType === "challenge")) {
    const pre = pick(DISAGREE_PREFIX, seed, "dis");
    return { displayText: `${pre}${text}`, pressureKind: "disagree" };
  }
  return { displayText: text, pressureKind: "none" };
}

export type NextQuestionResult = {
  question: GrillQuestion;
  timeLimitSeconds: number;
  displayText: string;
  pressureKind: "none" | "interrupt" | "disagree";
};

/**
 * Select the next live question. Returns `null` when the session should end.
 */
export function getNextQuestion(
  ctx: GrillContext,
  options?: { maxTurns?: number; bank?: GrillQuestion[] },
): NextQuestionResult | null {
  const maxTurns = options?.maxTurns ?? 8;
  if (ctx.turnIndex >= maxTurns) return null;

  const bank = options?.bank ?? GRILL_QUESTION_BANK;
  const phase = phaseForTurn(ctx.turnIndex);

  const pool = bank.filter(
    (q) =>
      q.phase === phase &&
      personaMatchesRow(q, ctx.personaId) &&
      q.id !== ctx.lastQuestionId,
  );
  const fallback = bank.filter(
    (q) => q.phase === phase && (q.persona === "all" || q.persona === ctx.personaId) && q.id !== ctx.lastQuestionId,
  );
  const usePool = pool.length ? pool : fallback;
  if (!usePool.length) {
    // Any phase: loosen filter
    const loose = bank.filter((q) => q.id !== ctx.lastQuestionId);
    if (!loose.length) return null;
    const q = pick(loose, String(ctx.turnIndex), ctx.personaId);
    const t = timeLimitSecondsForQuestion(ctx.mode, q.id, ctx.turnIndex);
    const styled = withPressurePrefix(q.text, ctx, q.type);
    return { question: q, timeLimitSeconds: t, displayText: styled.displayText, pressureKind: styled.pressureKind };
  }
  // Prefer items that touch a weak area tag if we have it
  const weak = ctx.weakAreas[0];
  const tagged = weak
    ? usePool.filter((q) =>
        q.tags?.some(
          (t) => weak.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(weak.toLowerCase()),
        ),
      )
    : [];
  const q = (tagged.length ? pick(tagged, `weak-${ctx.turnIndex}`, ctx.personaId) : pick(usePool, `q-${ctx.turnIndex}`, ctx.personaId)) as GrillQuestion;
  const t = timeLimitSecondsForQuestion(ctx.mode, q.id, ctx.turnIndex);
  const styled = withPressurePrefix(q.text, ctx, q.type);
  return { question: q, timeLimitSeconds: t, displayText: styled.displayText, pressureKind: styled.pressureKind };
}

export function nextPitchPhase(turnIndex: number): PitchPhase {
  return phaseForTurn(turnIndex);
}
