import type { SalesScriptVm } from "@/modules/sales-scripts/sales-script.types";

export type ObjectionKeywordId =
  | "not_interested"
  | "busy"
  | "already_have_leads"
  | "send_email"
  | "working_with_someone";

const PATTERNS: { id: ObjectionKeywordId; test: RegExp; label: string }[] = [
  { id: "not_interested", test: /\b(not interested|no thanks|don't call|stop calling|pass)\b/i, label: "not interested" },
  { id: "busy", test: /\b(busy|swamped|no time|bad time|in a meeting|running)\b/i, label: "busy" },
  {
    id: "already_have_leads",
    test: /\b(already have|enough leads|don't need|got plenty|covered)\b/i,
    label: "already have leads",
  },
  { id: "send_email", test: /\b(send (me )?an? email|email me|shoot me|drop me a(n)? email)\b/i, label: "send email" },
  {
    id: "working_with_someone",
    test: /\b(working with|already have (a )?broker|have an agent|signed with)\b/i,
    label: "already working with someone",
  },
];

export function detectObjectionFromProspectText(text: string | undefined): { id: ObjectionKeywordId; label: string } | null {
  if (!text?.trim()) return null;
  const t = text.trim();
  for (const p of PATTERNS) {
    if (p.test.test(t)) return { id: p.id, label: p.label };
  }
  return null;
}

const FALLBACK_REPLIES: Record<ObjectionKeywordId, string[]> = {
  not_interested: [
    "I hear you — can I ask one question before I go: are you open to seeing how inbound looks in your market, or is it a hard no for now?",
    "Totally fair. If I send a 60-second outline with no calls attached, would you skim it?",
  ],
  busy: [
    "Understood — what’s a calmer 10-minute slot this week: morning or afternoon?",
    "I’ll make this two sentences. Can I text you a link to book when you’re off the road?",
  ],
  already_have_leads: [
    "That’s great — we’re built to sit beside what works, not rip it out. Worth a 5-minute compare?",
    "Makes sense. Many teams use us as a second channel for overflow — open to seeing that flow?",
  ],
  send_email: [
    "Will do — what subject line will you actually open? I’ll match it.",
    "Sending now. One ask: if anything lands, reply “demo” and I’ll hold a slot.",
  ],
  working_with_someone: [
    "Thanks for saying so — we’re not here to poach relationships. If anything changes on tooling, can I stay on your radar as a backup?",
    "Appreciate the clarity. Happy to park this — want me to check back next quarter or leave it with you?",
  ],
};

/**
 * 2–3 suggested replies: prefer script-native objection lines, then fallbacks.
 */
export function getObjectionReplies(script: SalesScriptVm, detectedId: ObjectionKeywordId): string[] {
  const fromScript = script.objection_handling
    .filter((o) => {
      const w = o.when.toLowerCase();
      if (detectedId === "not_interested") return w.includes("not interested") || w.includes("interest");
      if (detectedId === "busy") return w.includes("busy") || w.includes("time");
      if (detectedId === "already_have_leads") return w.includes("lead") || w.includes("replace");
      if (detectedId === "send_email") return w.includes("email");
      if (detectedId === "working_with_someone") return w.includes("partner") || w.includes("approval");
      return false;
    })
    .map((o) => o.line);

  const fallback = FALLBACK_REPLIES[detectedId] ?? [];
  const merged = [...fromScript, ...fallback];
  const unique = [...new Set(merged)];
  return unique.slice(0, 3);
}
