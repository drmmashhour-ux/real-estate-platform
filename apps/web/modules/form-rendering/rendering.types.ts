export type DraftBundleSection = {
  templateKey: string | null;
  label: string;
  structuredPreview: Record<string, unknown>;
  disclaimer: string;
};

export type DraftExportBundle = {
  dealId: string;
  generatedAt: string;
  isDraftAssistance: true;
  brokerReviewRequired: true;
  sections: DraftBundleSection[];
  globalDisclaimer: string;
};
