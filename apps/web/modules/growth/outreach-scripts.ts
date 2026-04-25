/**
 * High-conversion, manual broker-acquisition DMs (Instagram / LinkedIn / follow-ups).
 * No send automation — copy, personalize, log status in the outreach hub.
 */

export type OutreachScriptType =
  | "FIRST_CONTACT"
  | "FOLLOW_UP_1"
  | "FOLLOW_UP_2"
  | "VALUE_PUSH"
  | "CLOSE_LOOP";

export interface OutreachScript {
  type: OutreachScriptType;
  /** Short label for the UI. */
  name: string;
  /** Main body (3–4 lines max; human, value-first). */
  content: string;
  /** Optional A/B line for the same type (e.g. first touch). */
  altContent?: string;
}

export const OUTREACH_SCRIPTS: OutreachScript[] = [
  {
    type: "FIRST_CONTACT",
    name: "First contact",
    content: "Hey! Quick question — are you currently getting enough qualified leads or still chasing them?",
    altContent: "Hey, random question — how are you managing your leads right now? I’m building something for brokers.",
  },
  {
    type: "FOLLOW_UP_1",
    name: "Follow-up 1 (after 1–2 days)",
    content:
      "Just checking — I’m working on a tool that actually tells brokers which deal to focus on and what to do next. Thought it might be useful for you.",
  },
  {
    type: "FOLLOW_UP_2",
    name: "Follow-up 2 (light touch)",
    content:
      "Not trying to sell anything — just onboarding a few brokers early and giving them priority leads + AI insights.",
  },
  {
    type: "VALUE_PUSH",
    name: "Value push",
    content:
      "It basically analyzes your deals, shows which ones are most likely to close, and suggests what to say next. Saves a lot of time.",
  },
  {
    type: "CLOSE_LOOP",
    name: "Close loop (polite out)",
    content: "No worries if not now — if you ever want to try it, I can give you early access 👍",
  },
];

export type FirstContactVariant = "A" | "B";

const SCRIPT_BY_TYPE: Record<OutreachScriptType, OutreachScript> = Object.fromEntries(
  OUTREACH_SCRIPTS.map((s) => [s.type, s])
) as Record<OutreachScriptType, OutreachScript>;

/**
 * Return the main script text for a step. For `FIRST_CONTACT`, pass `variant: 'B'` to use the alternate open.
 */
export function getOutreachScript(
  type: OutreachScriptType,
  options?: { variant?: FirstContactVariant }
): string {
  const def = SCRIPT_BY_TYPE[type];
  if (!def) return "";
  if (type === "FIRST_CONTACT" && options?.variant === "B" && def.altContent) {
    return def.altContent;
  }
  return def.content;
}

export type SuggestNextResult = {
  script: OutreachScriptType;
  /** Manual-assist nudge (we never auto-send). */
  hint: string;
};

const MS_DAY = 86_400_000;

/**
 * Map pipeline status → suggested template. Timing notes are hints only.
 */
export function suggestNextFollowUp(
  status: string,
  lastContactedAt?: string | Date | null
): SuggestNextResult | null {
  const t = lastContactedAt
    ? typeof lastContactedAt === "string"
      ? new Date(lastContactedAt)
      : lastContactedAt
    : null;
  const valid = t && !Number.isNaN(t.getTime());
  const days = valid ? (Date.now() - t!.getTime()) / MS_DAY : null;

  switch (status) {
    case "NEW":
      return { script: "FIRST_CONTACT", hint: "First touch: keep it short; personalize the opening if you can." };
    case "CONTACTED":
      if (days != null && days < 1.2) {
        return {
          script: "FOLLOW_UP_1",
          hint: "Optional: wait 1–2 days after first message before follow-up 1 (you track manually).",
        };
      }
      if (days != null && days >= 4) {
        return {
          script: "FOLLOW_UP_2",
          hint: "It’s been a few days — a lighter nudge (follow-up 2) can work if follow-up 1 had no reply.",
        };
      }
      return { script: "FOLLOW_UP_1", hint: "Typical: send follow-up 1 about 1–2 days after first contact." };
    case "RESPONDED":
    case "INTERESTED":
      return { script: "VALUE_PUSH", hint: "They replied: lead with a clear, concrete value line." };
    case "ONBOARDED":
    case "LOST":
    default:
      return null;
  }
}

/**
 * One-line opening for manual use: "Hey [name], saw you’re working in [city] — quick question —"
 * (Only includes parts you pass; no fake data.)
 */
export function buildPersonalizedMessage(
  name?: string | null,
  city?: string | null,
  specialty?: string | null
): string {
  const n = name?.trim();
  const c = city?.trim();
  const s = specialty?.trim();

  if (n && c) {
    return `Hey ${n}, saw you’re working in ${c} — quick question —`;
  }
  if (n && s) {
    return `Hey ${n}, saw your focus on ${s} — quick question —`;
  }
  if (n) {
    return `Hey ${n} — quick question —`;
  }
  if (c) {
    return `Hey — saw you’re in ${c} — quick question —`;
  }
  if (s) {
    return `Hey — quick question (saw you focus on ${s}) —`;
  }
  return "Hey — quick question —";
}

/**
 * Apply optional name / city / specialty to a script block. When no city/name/specialty, keeps a simple `Hey {name}` tweak for first touches.
 * Use for preview + “Copy message” in the outreach hub.
 */
export function mergePersonalizedMessage(
  content: string,
  meta: { name?: string | null; city?: string | null; specialty?: string | null }
): string {
  const hasRich =
    Boolean(meta.name?.trim()) || Boolean(meta.city?.trim()) || Boolean(meta.specialty?.trim());
  if (!hasRich) {
    if (content.startsWith("Hey!") && meta.name?.trim()) {
      return content.replace(/^Hey!/, `Hey ${meta.name.trim()}!`);
    }
    return content;
  }

  const head = buildPersonalizedMessage(meta.name, meta.city, meta.specialty);
  if (head === "Hey — quick question —") {
    if (content.startsWith("Hey!") && meta.name?.trim()) {
      return content.replace(/^Hey!/, `Hey ${meta.name.trim()}!`);
    }
    return content;
  }

  const stripped = content
    .replace(/^Hey!\s*Quick question\s*—\s*/i, "")
    .replace(/^Hey,?\s*random question\s*—\s*/i, "");
  if (stripped.length < content.length) {
    return `${head} ${stripped}`.replace(/\s+/g, " ").trim();
  }

  return `${head}\n\n${content}`.trim();
}
