const GROWTH_EXTRA_BLOCKED = new Set(["send_message", "notify_user", "external_sms", "outbound_message", "outbound_sms"]);

/**
 * Additive: blocks only clear messaging / outbound patterns (global Wave 8 checks still run first).
 * Unknown growth action types are allowed if they are not in the block list, so existing playbooks keep working.
 */
export function createGrowthExecutionAdapter() {
  return {
    canExecute(actionType: string): boolean {
      const at = (actionType ?? "").trim().toLowerCase();
      if (!at) {
        return false;
      }
      if (GROWTH_EXTRA_BLOCKED.has(at)) {
        return false;
      }
      if (/(message|sms|email|whatsapp|outbound|notify|push)/.test(at)) {
        return false;
      }
      return true;
    },
    async execute(actionType: string, payload: unknown): Promise<{ success: boolean }> {
      // No side effects: validation-only hook (actual logging happens in the memory engine).
      void actionType;
      void payload;
      return { success: true };
    },
  };
}
