import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const DEFAULT_CONTENT = `
<h2>1. Scope</h2>
<p>These Developer Terms apply to all developers who list projects on the Projects hub. By applying to become a developer, you agree to these terms.</p>

<h2>2. Eligibility</h2>
<p>You must be a duly registered company or entity and provide accurate company name, registration number, and supporting documents. You are responsible for compliance with applicable real estate and securities laws.</p>

<h2>3. Project Listings</h2>
<p>Project information must be accurate and not misleading. You must disclose material risks and comply with disclosure requirements in your jurisdiction.</p>

<h2>4. Acceptance</h2>
<p>By submitting a developer application and checking the acceptance box, you confirm that you have read and accept these Developer Terms and that the information provided is accurate.</p>
`;

export default function DeveloperTermsPage() {
  return (
    <LegalPageLayout
      title="Projects Hub – Developer Terms"
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
