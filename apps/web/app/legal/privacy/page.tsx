import type { Metadata } from "next";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PRIVACY_DEFAULT_HTML } from "@/lib/legal/default-legal-en";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LECIPM privacy policy — Québec Law 25 and Canada.",
};

export default async function LegalPrivacyPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.PRIVACY);
  const content = doc?.content?.trim() || PRIVACY_DEFAULT_HTML;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout title="Privacy Policy" version={version} updatedAt={updatedAt} backHref="/">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
