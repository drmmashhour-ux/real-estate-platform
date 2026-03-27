import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

/** Shown in mortgage hub UI and appended to every mortgage system prompt. */
export const MORTGAGE_AI_LEGAL_NOTICE =
  "AI does not replace financial, tax, or lender approval. Rates, approvals, and commitments require a licensed professional and your lender.";

function withMortgageNotice(system: string): string {
  return `${system}\n\n[Mortgage hub — required notice]\n${MORTGAGE_AI_LEGAL_NOTICE}`;
}

export function buildMortgageAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = withMortgageNotice(buildBaseSystem("mortgage", intent));
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "request_summary":
      return {
        system:
          system +
          " Summarize the buyer's mortgage request and what is incomplete; never claim approval.",
        user: `Task: Mortgage request summary.\nContext:\n${userJson}`,
      };
    case "affordability_explain":
      return {
        system:
          system +
          " Explain calculator outputs in plain language with uncertainty; not a commitment.",
        user: `Task: Affordability explanation.\nContext:\n${userJson}`,
      };
    case "broker_reply_draft":
      return {
        system:
          system +
          " Draft a broker reply to the buyer for manual send; professional and compliant tone.",
        user: `Task: Broker reply draft.\nContext:\n${userJson}`,
      };
    case "risk_missing":
      return {
        system:
          system +
          " Flag missing documents or unclear financial fields; educational only.",
        user: `Task: Risk / missing info.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function mortgageOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "request_summary":
      return "Offline mode: Verify income, liabilities, down payment, and property details before advising next steps.";
    case "affordability_explain":
      return "Offline mode: Affordability tools are estimates — actual approval depends on lender rules and verification.";
    case "broker_reply_draft":
      return "Offline mode: Acknowledge receipt, list missing items, and set expectations on timeline (not a rate promise).";
    case "risk_missing":
      return "Offline mode: Watch for missing pay stubs, tax returns, employment letters, or unclear debt payments.";
    default:
      return "Offline AI: mortgage outcomes require licensed experts and lender verification.";
  }
}
