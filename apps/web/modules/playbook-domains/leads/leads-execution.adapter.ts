const BLOCKED = new Set([
  "send_message",
  "notify_user",
  "external_sms",
  "outbound_sms",
  "outbound_listing_blast",
  "auto_sms",
]);

/**
 * LEADS domain: reject obvious outbound / messaging automation. Validation-only; never performs sends.
 */
export function createLeadsExecutionAdapter() {
  return {
    canExecute(actionType: string): boolean {
      const at = (actionType ?? "").trim().toLowerCase();
      if (!at) return false;
      if (BLOCKED.has(at)) return false;
      if (/(auto_send|outbound|sms|whatsapp|blast|spam)/.test(at)) return false;
      return true;
    },
    async execute(_actionType: string, _payload: unknown): Promise<{ success: boolean }> {
      return { success: true };
    },
  };
}
