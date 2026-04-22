import type { Metadata } from "next";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { TERMS_DEFAULT_HTML } from "@/lib/legal/default-legal-en";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LECIPM terms of service — Québec / Canada.",
};

export default async function LegalTermsPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.TERMS);
  const content = doc?.content?.trim() || TERMS_DEFAULT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout title="Terms of Service" version={version} updatedAt={updatedAt} backHref="/">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
