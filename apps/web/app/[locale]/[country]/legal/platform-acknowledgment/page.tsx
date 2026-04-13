import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PLATFORM_ACKNOWLEDGMENT_HTML } from "@/lib/legal/platform-acknowledgment-html";

export const metadata = {
  title: "Platform terms, acknowledgment & user responsibility",
  description:
    "Platform role, licensing, accuracy, disclosures, rentals, contracts, payments, and limitation of responsibility.",
};

export default async function PlatformAcknowledgmentPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT);
  const content = doc?.content?.trim() || PLATFORM_ACKNOWLEDGMENT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="Platform terms, acknowledgment & user responsibility"
      version={version}
      updatedAt={updatedAt}
      backHref="/legal"
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
