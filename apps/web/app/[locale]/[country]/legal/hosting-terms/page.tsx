import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const DEFAULT_CONTENT = `
<h2>1. Scope</h2>
<p>These Hosting Terms apply to all hosts who list properties on BNHUB (short-term rental). By applying to become a host, you agree to these terms.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years old and have the legal right to list the property (as owner or authorized representative). You must provide accurate identity and property information and required documents.</p>

<h2>3. Listing Accuracy</h2>
<p>Listings must accurately describe the property, amenities, and rules. You must comply with local short-term rental laws and obtain any required permits.</p>

<h2>4. Bookings and Payments</h2>
<p>Bookings are subject to platform policies. You agree to honour confirmed reservations and to handle disputes in good faith.</p>

<h2>5. Acceptance</h2>
<p>By submitting a host application and checking the acceptance box, you confirm that you have read and accept these Hosting Terms.</p>
`;

export default function HostingTermsPage() {
  return (
    <LegalPageLayout
      title="BNHUB Hosting Terms"
      version={null}
      updatedAt={null}
    >
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT }}
      />
    </LegalPageLayout>
  );
}
