import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PRIVACY_DEFAULT_HTML } from "@/lib/legal/default-legal-en";

export default async function PrivacyPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.PRIVACY);
  const content = doc?.content?.trim() || PRIVACY_DEFAULT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="Privacy Policy"
      version={version}
      updatedAt={updatedAt}
      backHref="/legal"
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
