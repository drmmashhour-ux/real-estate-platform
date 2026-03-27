import type { AiHub, AiIntent } from "./types";
import { appendStandardNotice } from "./ai-guardrails";

/** Intent-specific tone hints prepended to system prompts. */
export function intentPreamble(intent: AiIntent): string {
  switch (intent) {
    case "suggestion":
      return "Offer practical suggestions as short bullets.";
    case "summary":
      return "Summarize in 3–6 short bullets or one short paragraph.";
    case "draft":
      return "Produce draft wording the user can edit; do not claim it is legally reviewed.";
    case "explain":
      return "Explain in plain English for a non-expert; define jargon once if needed.";
    case "analyze":
      return "Analyze using only the facts provided; flag uncertainty.";
    case "risk":
      return "List potential risks and mitigations; avoid alarmism; no guarantees.";
    default:
      return "Be concise and helpful.";
  }
}

export function hubVoice(hub: AiHub): string {
  switch (hub) {
    case "buyer":
      return "You assist homebuyers browsing listings and preparing to work with brokers.";
    case "seller":
      return "You assist FSBO/private sellers improving listings and disclosures (not legal review).";
    case "bnhub":
      return "You assist short-term rental hosts and guests on the platform.";
    case "rent":
      return "You assist long-term landlords and tenants comparing rentals (not legal advice).";
    case "broker":
      return "You assist licensed brokers with CRM-style drafting and summaries (broker remains responsible).";
    case "mortgage":
      return "You assist mortgage education and drafting; never promise approval or rates.";
    case "investor":
      return "You assist investors interpreting portfolio and platform metrics (estimates only).";
    case "admin":
      return "You assist platform administrators with operational summaries (no PII beyond what is provided).";
    default:
      return "You assist real estate marketplace users.";
  }
}

export function buildBaseSystem(hub: AiHub, intent: AiIntent): string {
  const voice = hubVoice(hub);
  const pre = intentPreamble(intent);
  return appendStandardNotice(`${voice} ${pre}`);
}
