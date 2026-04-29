/**
 * Lightweight SYBNB booking-chat risk hints — advisory only (never blocks delivery server-side).
 *
 * ## Phase 1 — `analyzeMessage(content)`
 *
 * | Signal | Detection |
 * |--------|-----------|
 * | **phone** | Digit runs (8+) + phone-ish patterns (`PHONE_LIKE` / `DIGIT_RUN`) |
 * | **email** | `@` domain regex |
 * | **external_payment** | Keywords: `whatsapp`, `telegram`, `send money`, `bank transfer outside`, `pay outside` |
 * | **link** | `http://` / `https://` |
 *
 * **Risk:** `high` if multiple serious signals combine; `medium` if any phone/email/external_payment or score threshold; else `low`.
 *
 * ## Integration (Phases 2–7)
 *
 * - **POST /api/sybnb/messages** runs analysis before insert; **medium/high** → warning JSON + modal confirm (`confirmRisk`).
 * - **SybnbMessage** stores `riskLevel` + `riskFlags` (JSON array).
 * - **CHAT_RISK_DETECTED** audit when confirmed medium/high send.
 * - **ChatBox** shows ⚠️ + tooltip for medium/high rows.
 */

export type ChatMessageRiskLevel = "low" | "medium" | "high";

/** Stable labels for analytics / UI; maps keyword hits into `external_payment` when scam-adjacent. */
export type ChatMessageRiskFlag = "phone" | "email" | "link" | "external_payment";

export type ChatMessageAnalysis = {
  risk: ChatMessageRiskLevel;
  flags: ChatMessageRiskFlag[];
};

const KEYWORD_SNIPPETS = [
  "whatsapp",
  "telegram",
  "send money",
  "bank transfer outside",
  "pay outside",
] as const;

/** International-ish phone-ish sequences (lightweight; avoids blocking legitimate text). */
const PHONE_LIKE =
  /(?:\+?\d{1,4}[\s.\u00A0-]?)?(?:\(?\d{2,4}\)?[\s.\u00A0-]?)?\d{2,4}[\s.\u00A0-]?\d{2,6}[\s.\u00A0-]?\d{1,6}\b/g;

const DIGIT_RUN = /\d{8,}/;

const EMAIL_LIKE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const HTTP_LINK = /\bhttps?:\/\//i;

function hasPhoneSignal(content: string): boolean {
  const condensed = content.replace(/\s/g, "");
  if (DIGIT_RUN.test(condensed)) return true;
  const matches = content.match(PHONE_LIKE);
  return Boolean(matches?.some((m) => (m.replace(/\D/g, "").length ?? 0) >= 8));
}

function uniqFlags(flags: ChatMessageRiskFlag[]): ChatMessageRiskFlag[] {
  return [...new Set(flags)];
}

/**
 * Heuristic risk scoring — tuned for recall over precision; callers warn, never hard-block.
 */
export function analyzeMessage(content: string): ChatMessageAnalysis {
  const flags: ChatMessageRiskFlag[] = [];
  const lower = content.toLowerCase();

  if (EMAIL_LIKE.test(content)) {
    flags.push("email");
  }

  const phoneHit = hasPhoneSignal(content);
  if (phoneHit) {
    flags.push("phone");
  }

  if (HTTP_LINK.test(content)) {
    flags.push("link");
  }

  let keywordHit = false;
  for (const k of KEYWORD_SNIPPETS) {
    if (lower.includes(k)) {
      keywordHit = true;
      break;
    }
  }
  if (keywordHit) {
    flags.push("external_payment");
  }

  const uniq = uniqFlags(flags);

  let score = 0;
  if (uniq.includes("phone")) score += 3;
  if (uniq.includes("email")) score += 3;
  if (uniq.includes("external_payment")) score += 3;
  if (uniq.includes("link")) score += 1;

  const phoneAndEmail = uniq.includes("phone") && uniq.includes("email");
  const phoneAndExternal = phoneHit && uniq.includes("external_payment");

  let risk: ChatMessageRiskLevel = "low";
  if (phoneAndEmail || phoneAndExternal || score >= 6 || (uniq.includes("phone") && uniq.includes("external_payment"))) {
    risk = "high";
  } else if (score >= 2 || uniq.includes("phone") || uniq.includes("email") || uniq.includes("external_payment")) {
    risk = "medium";
  }

  return { risk, flags: uniq };
}

export function analysisNeedsUserConfirmation(a: ChatMessageAnalysis): boolean {
  return a.risk === "medium" || a.risk === "high";
}
