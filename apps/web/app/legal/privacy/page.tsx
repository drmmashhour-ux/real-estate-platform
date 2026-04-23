import type { Metadata } from "next";
import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PRIVACY_DEFAULT_HTML } from "@/lib/legal/default-legal-en";
import { PrivacyOfficerInfo } from "@/modules/privacy/components/PrivacyOfficerInfo";
import { PrivacyComplaintForm } from "@/modules/privacy/components/PrivacyComplaintForm";
import { MandatoryPrivacyWarnings } from "@/modules/privacy/components/MandatoryPrivacyWarnings";

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
      <div className="space-y-12">
        <section>
          <PrivacyOfficerInfo />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Our Commitment to Privacy</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
          <div>
            <h3 className="text-xl font-bold mb-4">Retention and Destruction</h3>
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, 
                including for the purposes of satisfying any legal, accounting, or reporting requirements. 
                Once the retention period has expired, your information is securely destroyed or anonymized.
              </p>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Regulatory Compliance</h3>
              <MandatoryPrivacyWarnings />
            </div>
          </div>

          <div>
            <PrivacyComplaintForm />
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}
