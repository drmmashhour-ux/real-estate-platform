import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-broker-collaboration-agreement";

export const metadata = {
  title: "BNHub broker collaboration & commission agreement",
  description: "Lead distribution, commission structure, and broker obligations on BNHub.",
};

export default async function BnhubBrokerCollaborationPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.BNHUB_BROKER_COLLABORATION_AGREEMENT);
  const content = doc?.content?.trim() || NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="BNHub broker collaboration & commission agreement"
      version={version}
      updatedAt={updatedAt}
      backHref="/legal"
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
