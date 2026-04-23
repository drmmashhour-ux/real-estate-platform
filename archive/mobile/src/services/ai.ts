import { lecipmApi } from "./api";

export type ManagerChatResponse = {
  reply: string;
  agentKey?: string | null;
  conversationId?: string | null;
  lecipmManager?: boolean;
};

/**
 * LECIPM Manager AI — uses existing `/api/ai/chat` + `handleLecipmManagerChat` (orchestrator).
 */
export type AutonomyStatusResponse = {
  normalizedMode?: string;
  globalKillSwitch?: boolean;
  autonomyPausedUntil?: string | null;
  metrics24h?: { runs?: number; actionsExecuted?: number; actionsFailed?: number };
};

export async function fetchAutonomyStatus(): Promise<AutonomyStatusResponse> {
  const { data } = await lecipmApi.get<AutonomyStatusResponse>("/api/ai/autonomy/status");
  return data;
}

export async function sendMessage(
  message: string,
  options?: { conversationId?: string | null; listingId?: string; bookingId?: string }
): Promise<ManagerChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Message is empty");
  }
  const { data } = await lecipmApi.post<ManagerChatResponse>("/api/ai/chat", {
    lecipmManager: true,
    message: trimmed,
    conversationId: options?.conversationId ?? undefined,
    context: {
      surface: "mobile",
      listingId: options?.listingId,
      bookingId: options?.bookingId,
    },
  });
  return data;
}
