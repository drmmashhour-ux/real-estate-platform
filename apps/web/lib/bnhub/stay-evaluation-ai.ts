import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type GuestStayChecklist = {
  overallMetExpectations?: boolean;
  bedsSleepingAsDescribed?: boolean;
  bathroomsCleanAccurate?: boolean;
  kitchenAsDescribed?: boolean;
  amenitiesMatchedListing?: boolean;
  cleanlinessOk?: boolean;
  checkInProcessOk?: boolean;
};

export type HostGuestChecklist = {
  respectedQuietHours?: boolean;
  respectedHouseRules?: boolean;
  leftPropertyReasonablyTidy?: boolean;
  communicationReasonable?: boolean;
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function checklistCoverageScore(checklist: GuestStayChecklist | undefined): number {
  if (!checklist) return 0.5;
  const keys = Object.keys(checklist) as (keyof GuestStayChecklist)[];
  const answered = keys.filter((k) => checklist[k] !== undefined);
  if (answered.length === 0) return 0.5;
  const yes = answered.filter((k) => checklist[k] === true).length;
  return yes / answered.length;
}

/** Deterministic 0–100 from stars + checklist + amenities flag. */
export function deterministicGuestStayScore(input: {
  propertyRating: number;
  checklist?: GuestStayChecklist;
  amenitiesAsAdvertised?: boolean | null;
  comment?: string | null;
}): { score: number; summary: string } {
  const starPart = (Math.max(1, Math.min(5, input.propertyRating)) / 5) * 55;
  const checklistPart = checklistCoverageScore(input.checklist) * 30;
  let amenPart = 7.5;
  if (input.amenitiesAsAdvertised === false) amenPart = 0;
  else if (input.amenitiesAsAdvertised === true) amenPart = 15;
  const commentBonus =
    input.comment && input.comment.trim().length > 40 ? 5 : input.comment && input.comment.trim().length > 0 ? 2 : 0;
  const score = Math.round(Math.min(100, starPart + checklistPart + amenPart + commentBonus));
  const summary = `Composite ${score}/100 from stay ratings and checklist attestation.`;
  return { score, summary };
}

export function deterministicHostGuestScore(input: {
  guestRespectRating: number;
  propertyCareRating?: number | null;
  checkoutComplianceRating?: number | null;
  theftOrDamageReported: boolean;
  checklist?: HostGuestChecklist;
  hostNotes?: string | null;
  incidentDetails?: string | null;
}): { score: number; summary: string } {
  const r = Math.max(1, Math.min(5, input.guestRespectRating));
  let base = (r / 5) * 70;
  if (input.propertyCareRating != null) {
    base += (Math.max(1, Math.min(5, input.propertyCareRating)) / 5) * 10;
  } else base += 5;
  if (input.checkoutComplianceRating != null) {
    base += (Math.max(1, Math.min(5, input.checkoutComplianceRating)) / 5) * 10;
  } else base += 5;
  if (input.theftOrDamageReported) base = Math.min(base, 35);
  const chk = input.checklist;
  if (chk) {
    const items = [
      chk.respectedQuietHours,
      chk.respectedHouseRules,
      chk.leftPropertyReasonablyTidy,
      chk.communicationReasonable,
    ].filter((x) => x !== undefined);
    if (items.length) {
      const frac = items.filter(Boolean).length / items.length;
      base = base * (0.75 + 0.25 * frac);
    }
  }
  if (input.incidentDetails && input.incidentDetails.trim().length > 20) {
    base = Math.min(base, 45);
  }
  const score = Math.round(Math.max(0, Math.min(100, base)));
  const summary = input.theftOrDamageReported
    ? `Composite ${score}/100; host reported theft or damage — trust review recommended.`
    : `Composite ${score}/100 from host evaluation of guest conduct.`;
  return { score, summary };
}

async function openAiJson<T>(system: string, user: string): Promise<T | null> {
  if (!isOpenAiConfigured()) return null;
  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_EVAL_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * AI refines 0–100 score + one-line summary when OPENAI_API_KEY is set; otherwise deterministic only.
 */
export async function computeGuestStayEvaluation(input: {
  propertyRating: number;
  checklist?: GuestStayChecklist;
  amenitiesAsAdvertised?: boolean | null;
  comment?: string | null;
}): Promise<{ score: number; summary: string; source: "openai" | "deterministic" }> {
  const det = deterministicGuestStayScore(input);
  const ai = await openAiJson<{ score: number; summary: string }>(
    `You adjust a short-term rental guest review into a single quality score 0-100 and a neutral one-sentence summary for internal reputation. 
Respond JSON only: {"score": number, "summary": string}. 
Stay within 10 points of the deterministic anchor when checklist and stars are consistent; penalize clear mismatch (e.g. 5 stars but amenitiesAsAdvertised false).`,
    JSON.stringify({
      propertyRating: input.propertyRating,
      checklist: input.checklist ?? null,
      amenitiesAsAdvertised: input.amenitiesAsAdvertised ?? null,
      commentSnippet: input.comment?.slice(0, 500) ?? null,
      deterministicAnchor: det.score,
    })
  );
  if (ai && typeof ai.score === "number" && ai.summary) {
    const score = Math.max(0, Math.min(100, Math.round(ai.score)));
    return { score, summary: ai.summary.slice(0, 500), source: "openai" };
  }
  return { ...det, source: "deterministic" };
}

export async function computeHostGuestEvaluation(input: {
  guestRespectRating: number;
  propertyCareRating?: number | null;
  checkoutComplianceRating?: number | null;
  theftOrDamageReported: boolean;
  checklist?: HostGuestChecklist;
  hostNotes?: string | null;
  incidentDetails?: string | null;
}): Promise<{ score: number; summary: string; source: "openai" | "deterministic" }> {
  const det = deterministicHostGuestScore(input);
  const ai = await openAiJson<{ score: number; summary: string }>(
    `You score a guest after a short-term stay for internal host reputation. JSON only: {"score": number, "summary": string}.
If theftOrDamageReported is true, cap score at 45 unless details are clearly minor. One neutral sentence summary.`,
    JSON.stringify({
      ...input,
      hostNotes: input.hostNotes?.slice(0, 600) ?? null,
      incidentDetails: input.incidentDetails?.slice(0, 600) ?? null,
      deterministicAnchor: det.score,
    })
  );
  if (ai && typeof ai.score === "number" && ai.summary) {
    let score = Math.max(0, Math.min(100, Math.round(ai.score)));
    if (input.theftOrDamageReported) score = Math.min(score, 45);
    return { score, summary: ai.summary.slice(0, 500), source: "openai" };
  }
  return { ...det, source: "deterministic" };
}

export { median };
