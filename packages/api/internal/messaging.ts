import type { MessageThreadRecord } from "./types";

export type MessagingServiceContext = {
  partnerId?: string;
};

const stub: MessageThreadRecord[] = [
  {
    id: "thread_stub_1",
    channel: "deal_room",
    lastMessageAt: new Date().toISOString(),
    preview: "Internal messaging stub — connect to real message store.",
  },
];

export async function listThreads(ctx: MessagingServiceContext): Promise<MessageThreadRecord[]> {
  return stub.map((t) => ({ ...t, id: `${t.id}_${ctx.partnerId ?? "default"}` }));
}
