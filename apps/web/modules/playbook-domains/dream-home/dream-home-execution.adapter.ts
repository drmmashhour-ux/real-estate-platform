const ALLOW = new Set([
  "dream_home_generate_profile",
  "dream_home_generate_filters",
  "dream_home_rank_listings",
  "dream_home_recommend_playbook",
]);

const BLOCK = new Set([
  "outbound_contact",
  "send_email",
  "financial_commitment",
  "legal_action",
  "auto_broker_contact",
  "message",
  "sms",
  "whatsapp",
  "notify",
  "outbound",
  "nationality",
  "ethnic",
  "inferred_trait_signal",
]);

function canExecuteAction(actionType: string): boolean {
  const at = (actionType ?? "").trim().toLowerCase();
  if (!at) {
    return false;
  }
  for (const b of BLOCK) {
    if (at === b || at.includes(b)) {
      return false;
    }
  }
  return ALLOW.has(at);
}

/**
 * Dream Home: ranking + recommendations only. No broker automation or messaging.
 */
export function createDreamHomeExecutionAdapter() {
  return {
    canExecute: canExecuteAction,
    async execute(
      actionType: string,
      payload: unknown,
    ): Promise<{ success: boolean; message?: string }> {
      void payload;
      if (canExecuteAction(actionType)) {
        return { success: true, message: "no_op_metadata_only" };
      }
      return { success: false, message: "action_not_permitted_for_dream_home" };
    },
  };
}
