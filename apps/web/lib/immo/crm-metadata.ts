export type CrmConversationMetadata = {
  capture?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  intent?: "buy" | "rent" | "mortgage" | "expert" | "general";
  /** ISO timestamp — throttle expert ping notifications */
  lastExpertMessagePingAt?: string;
  leadCreatedAt?: string;
};

export function parseMetadata(raw: unknown): CrmConversationMetadata {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const capture = o.capture;
  const out: CrmConversationMetadata = { intent: o.intent as CrmConversationMetadata["intent"] };
  if (capture && typeof capture === "object") {
    const c = capture as Record<string, unknown>;
    out.capture = {
      name: typeof c.name === "string" ? c.name : undefined,
      email: typeof c.email === "string" ? c.email : undefined,
      phone: typeof c.phone === "string" ? c.phone : undefined,
    };
  }
  if (typeof o.lastExpertMessagePingAt === "string") out.lastExpertMessagePingAt = o.lastExpertMessagePingAt;
  if (typeof o.leadCreatedAt === "string") out.leadCreatedAt = o.leadCreatedAt;
  return out;
}

export function mergeMetadata(
  prev: unknown,
  patch: Partial<CrmConversationMetadata>
): CrmConversationMetadata {
  const base = parseMetadata(prev);
  return {
    ...base,
    ...patch,
    capture: { ...base.capture, ...patch.capture },
  };
}
