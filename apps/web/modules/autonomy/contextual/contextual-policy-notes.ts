export function buildContextualPolicyNote(action: {
  domain: string;
  actionType: string;
  signalKey: string;
  contextFeatures?: Record<string, string>;
}) {
  const parts = [
    `Action ${action.actionType} in domain ${action.domain} was selected`,
    `under signal ${action.signalKey}.`,
  ];

  if (action.contextFeatures && Object.keys(action.contextFeatures).length > 0) {
    const ctx = Object.entries(action.contextFeatures)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");

    parts.push(`Context used: ${ctx}.`);
  }

  parts.push("Final execution remains subject to policy validation and autonomy mode.");

  return parts.join(" ");
}
