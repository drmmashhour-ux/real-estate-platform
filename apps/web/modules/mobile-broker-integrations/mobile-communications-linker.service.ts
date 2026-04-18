export function communicationDraftDeepLink(draftId: string): { webPath: string } {
  return { webPath: `/dashboard/broker/intake?draft=${encodeURIComponent(draftId)}` };
}
