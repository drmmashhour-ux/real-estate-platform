import "server-only";

export const CLIENT_CHAT_DISCLAIMER =
  "Indications générales uniquement — consultez un courtier agréé OACIQ pour tout engagement.";

export type ClientChatContext = Record<string, unknown>;

export type QualificationState = Record<string, unknown>;

type ProcessFlags = {
  escalateToBroker: boolean;
  escalationReason?: string | null;
  chatCompleteCold: boolean;
  leadReady: boolean;
  qualificationTier: "cold" | "warm" | "hot";
};

/** Route calls synchronously — must not be async. */
export function processClientChatTurn(input: {
  message: string;
  state: QualificationState;
  context: ClientChatContext;
}): {
  reply: string;
  disclaimer: string;
  state: QualificationState;
  flags: ProcessFlags;
} {
  return {
    reply: "",
    disclaimer: CLIENT_CHAT_DISCLAIMER,
    state: input.state,
    flags: {
      escalateToBroker: false,
      escalationReason: null,
      chatCompleteCold: false,
      leadReady: false,
      qualificationTier: "warm",
    },
  };
}

export function computeChatLeadScore(_state: QualificationState): {
  merged: number;
  qScore: number;
  qReasons: string[];
} {
  return { merged: 0, qScore: 0, qReasons: [] };
}

export function classifyQuebecTier(_state: QualificationState): "cold" | "warm" | "hot" {
  return "warm";
}

export function tierToScore(_tier: string): number {
  return 0;
}

export function buildLeadPayloadFromChat(
  _state: QualificationState,
  _merged: number,
  _tier: "cold" | "warm" | "hot",
  _qScore: number,
  _qReasons: string[],
): {
  name: string;
  phone: string;
  message: string;
  qualificationSnapshot: Record<string, unknown>;
} {
  return { name: "", phone: "", message: "", qualificationSnapshot: {} };
}

export async function clientCommunicationChat() {
  return { ok: true };
}
