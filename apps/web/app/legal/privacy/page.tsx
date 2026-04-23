import type { Metadata } from "next";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PRIVACY_DEFAULT_HTML } from "@/lib/legal/default-legal-en";
import { PrivacyOfficerInfo } from "@/modules/privacy/components/PrivacyOfficerInfo";

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
      <div className="space-y-8">
        <section>
          <PrivacyOfficerInfo />
        </section>

        <section dangerouslySetInnerHTML={{ __html: content }} />

        <section className="p-6 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="text-lg font-bold mb-2 text-blue-900">Retention and Destruction</h3>
          <p className="text-sm text-blue-800 mb-4">
            We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, 
            including for the purposes of satisfying any legal, accounting, or reporting requirements. 
            Once the retention period has expired, your information is securely destroyed or anonymized.
          </p>
          <div className="pt-4 border-t border-blue-200">
            <h4 className="font-bold text-sm text-blue-900 mb-2">Have a concern?</h4>
            <a href="/legal/privacy/complaint" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">
              Submit a Privacy Complaint
            </a>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
