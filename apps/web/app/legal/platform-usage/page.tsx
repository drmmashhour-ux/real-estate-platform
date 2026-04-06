import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const DEFAULT_PLATFORM_USAGE = `
<h2>1. Acceptable Use</h2>
<p>You may use the platform only for lawful purposes and in accordance with our Terms of Service and all applicable laws. You may not use the platform to harass, defraud, or harm others, or to circumvent platform policies or security.</p>

<h2>2. Prohibited Conduct</h2>
<p>Prohibited conduct includes: false or misleading information; scraping or automated access without permission; reselling or sublicensing access; interfering with the platform or other users; and any activity that could expose the platform or users to liability.</p>

<h2>3. Enforcement</h2>
<p>We may suspend or terminate accounts that violate this policy. We may report illegal activity to authorities and cooperate with law enforcement.</p>

<h2>4. Contact</h2>
<p>Report abuse: dr.m.mashhour@gmail.com</p>
`;

export default async function PlatformUsagePage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.PLATFORM_USAGE);
  const content = doc?.content?.trim() || DEFAULT_PLATFORM_USAGE;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="Platform Usage Policy"
      version={version}
      updatedAt={updatedAt}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
