export function classifyAssistance(input: {
  message: string;
  mentionsDeposit?: boolean;
  mentionsFraud?: boolean;
}) {
  if (input.mentionsFraud) return "pre-complaint";
  if (input.mentionsDeposit) return "guidance";

  return "info";
}

export function suggestAssistancePath(input: { requestType: string }) {
  if (input.requestType === "info") return "self_resolve";
  if (input.requestType === "guidance") return "contact_broker";
  if (input.requestType === "issue") return "contact_broker";
  if (input.requestType === "pre-complaint") return "file_complaint";

  return "self_resolve";
}

export function buildAssistanceRequestNumber(): string {
  return `ASST-${Date.now()}`;
}
