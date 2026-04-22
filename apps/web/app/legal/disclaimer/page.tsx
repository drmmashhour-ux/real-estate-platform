import type { Metadata } from "next";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { DISCLAIMER_DEFAULT_HTML } from "@/lib/legal/default-legal-en";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "LECIPM general disclaimer — intermediary platform, Québec / Canada.",
};

export default async function LegalDisclaimerPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.DISCLAIMER);
  const content = doc?.content?.trim() || DISCLAIMER_DEFAULT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout title="Disclaimer" version={version} updatedAt={updatedAt} backHref="/">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
