export const DEFAULT_FOLLOW_UP_MESSAGE = `Hey — just following up 🙂

Even 10–15 min is enough to see if this could help you in your deals.`;

export const DEFAULT_REPLY_TO_CALL_MESSAGE = `Awesome — when would you be available for a quick 15–20 min call?`;

export function generateFollowUpMessage(override?: string | null): string {
  const t = override?.trim();
  return t && t.length > 0 ? t : DEFAULT_FOLLOW_UP_MESSAGE;
}

export function generateReplyResponse(override?: string | null): string {
  const t = override?.trim();
  return t && t.length > 0 ? t : DEFAULT_REPLY_TO_CALL_MESSAGE;
}

export type HookAngle = "mistake" | "loss" | "curiosity";

export type BetterHooksResult = { angle: HookAngle; hooks: [string, string, string] };

/**
 * Three short hook ideas for short-form video — user picks and records manually.
 */
export function generateBetterHook(angle: HookAngle = "curiosity"): BetterHooksResult {
  switch (angle) {
    case "mistake":
      return {
        angle,
        hooks: [
          "The one underwriting mistake that quietly kills broker deals in Quebec.",
          "I watched a ‘small’ doc miss turn a closing into a 3-week mess — here’s the fix.",
          "Brokers don’t lose deals on price first — they lose them on missed steps.",
        ],
      };
    case "loss":
      return {
        angle,
        hooks: [
          "Every week you fly blind on the next step, you’re paying for it in time and stress.",
          "That ‘we’ll figure it out later’ line is expensive — here’s what it actually costs.",
          "If your pipeline feels busy but deals stall, you’re leaking margin somewhere.",
        ],
      };
    case "curiosity":
    default:
      return {
        angle: "curiosity",
        hooks: [
          "What if your next deal had a checklist that actually matched reality?",
          "Most broker tools organize tasks — this one argues for the next best move.",
          "15 seconds: how LECIPM keeps messy deals from going off the rails.",
        ],
      };
  }
}
