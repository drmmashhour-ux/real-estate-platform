import { Metadata } from "next";
import { PrivacyComplaintForm } from "@/modules/privacy/components/PrivacyComplaintForm";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Submit a Privacy Complaint | LECIPM",
  description: "Submit a privacy-related complaint or request under Law 25.",
};

export default function PrivacyComplaintPage() {
  return (
    <LegalPageLayout title="Privacy Complaint / Request" backHref="/legal/privacy">
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 mb-8">
          Use the form below to submit a formal complaint or request regarding your personal information. 
          Our Privacy Officer will review your submission and respond within 30 days.
        </p>
        <PrivacyComplaintForm />
      </div>
    </LegalPageLayout>
  );
}
