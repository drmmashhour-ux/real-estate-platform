/**
 * Future: attach a `DocumentFile` to a message or message metadata.
 * v1: store linkage only in `DocumentFile.metadata` or message `metadata` JSON.
 */
export async function linkDocumentToConversationMessage(_params: {
  documentFileId: string;
  conversationId: string;
  messageId?: string;
}): Promise<void> {
  void _params;
}
