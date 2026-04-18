export type PandaDocWebhookEvent = {
  type: string;
  documentId?: string;
  status?: string;
  recipientEmail?: string;
};

export function parsePandaDocWebhook(body: unknown): PandaDocWebhookEvent[] {
  const data = body as Record<string, unknown>;
  const evt = (data.event as string) ?? (data.type as string) ?? "unknown";
  const documentId = (data.id as string) ?? (data.document as { id?: string } | undefined)?.id;
  const nested = (data.data ?? data) as Record<string, unknown>;
  const recipientEmail =
    (nested.recipient_email as string) ??
    (nested.recipientEmail as string) ??
    (data.recipient_email as string) ??
    undefined;
  return [{ type: evt, documentId, status: data.status as string | undefined, recipientEmail }];
}
