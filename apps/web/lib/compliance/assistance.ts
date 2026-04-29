/** Public assistance triage helpers (additive, heuristic). */

export function classifyAssistance(input: {
  message: string;
  mentionsDeposit: boolean;
  mentionsFraud: boolean;
}): string {
  const m = input.message.toLowerCase();
  if (input.mentionsFraud || m.includes("fraud") || m.includes("scam") || m.includes("arnaque")) {
    return "fraud_escalation";
  }
  if (input.mentionsDeposit || m.includes("deposit") || m.includes("dépôt") || m.includes("depot")) {
    return "deposit_dispute";
  }
  if (m.includes("commission") || m.includes("courtier") || m.includes("broker")) {
    return "broker_question";
  }
  return "general_inquiry";
}

export function suggestAssistancePath(opts: { requestType: string }): string {
  switch (opts.requestType) {
    case "fraud_escalation":
    case "deposit_dispute":
      return "file_complaint";
    case "broker_question":
      return "broker_queue";
    default:
      return "self_serve_help";
  }
}

export function buildAssistanceRequestNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `AS-${t}-${r}`;
}
