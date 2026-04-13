/**
 * Placeholder for drafting guide / clause bank text.
 * Connect to internal knowledge base or admin-uploaded guides later.
 */
export type DraftingGuideSource = {
  id: string;
  title: string;
  body: string;
  sourceRef: string;
};

export async function getDraftingGuideSources(args: {
  templateKey: string;
}): Promise<DraftingGuideSource[]> {
  void args.templateKey;
  return [];
}
