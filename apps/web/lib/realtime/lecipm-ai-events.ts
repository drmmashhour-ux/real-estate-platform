import { redisPublish } from "@/lib/cache/redis";

export const LECIPM_AI_REDIS_CHANNEL = "lecipm:ai";

export type LecipmAiRealtimeEvent =
  | "ai_recommendation_created"
  | "ai_action_executed"
  | "ai_override_required"
  | "ai_health_alert";

export type LecipmAiRealtimePayload = {
  event: LecipmAiRealtimeEvent;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

export async function publishLecipmAiEvent(payload: LecipmAiRealtimePayload): Promise<void> {
  try {
    await redisPublish(LECIPM_AI_REDIS_CHANNEL, JSON.stringify(payload));
  } catch {
    /* optional redis — fail silently */
  }
}
