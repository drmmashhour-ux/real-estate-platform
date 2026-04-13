import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";

const STATUSES: LecipmBrokerCrmLeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "visit_scheduled",
  "negotiating",
  "closed",
  "lost",
];

export function parseLeadStatus(raw: unknown): { ok: true; status: LecipmBrokerCrmLeadStatus } | { ok: false; error: string } {
  if (typeof raw !== "string" || !STATUSES.includes(raw as LecipmBrokerCrmLeadStatus)) {
    return { ok: false, error: "Invalid status" };
  }
  return { ok: true, status: raw as LecipmBrokerCrmLeadStatus };
}

export function parseNoteBody(raw: unknown): { ok: true; body: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim().length < 1) return { ok: false, error: "Note is required" };
  if (raw.length > 20000) return { ok: false, error: "Note is too long" };
  return { ok: true, body: raw.trim() };
}

export function parseTag(raw: unknown): { ok: true; tag: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim().length < 1) return { ok: false, error: "Tag is required" };
  const t = raw.trim().slice(0, 64);
  return { ok: true, tag: t };
}
