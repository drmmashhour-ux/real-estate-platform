import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { NBHUB_LONG_TERM_RENTAL_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-long-term-rental-agreement";

export const metadata = {
  title: "BNHub long-term rental agreement",
  description: "Terms for BNHub long-term (monthly) rentals between landlords and tenants.",
};

export default async function BnhubLongTermRentalPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT);
  const content = doc?.content?.trim() || NBHUB_LONG_TERM_RENTAL_AGREEMENT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="BNHub long-term rental agreement"
      version={version}
      updatedAt={updatedAt}
      backHref="/legal"
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
