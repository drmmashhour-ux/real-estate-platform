import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const DEFAULT_COOKIES = `
<h2>1. What We Use</h2>
<p>We use cookies and similar technologies for essential operation, preferences, analytics, and security.</p>

<h2>2. Types</h2>
<p><strong>Essential:</strong> Required for login, session, and security. <strong>Preferences:</strong> Language, consent choices. <strong>Analytics:</strong> To improve the platform (may be anonymized).</p>

<h2>3. Your Choice</h2>
<p>You can accept or decline non-essential cookies via the cookie banner. Essential cookies cannot be disabled for the service to function.</p>

<h2>4. Third Parties</h2>
<p>Some features may use third-party cookies (e.g. maps, payments). Their use is governed by their respective policies.</p>

<h2>5. Contact</h2>
<p>
        Questions: <a href="mailto:info@lecipm.com">info@lecipm.com</a>
      </p>
`;

export default async function CookiesPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.COOKIES);
  const content = doc?.content?.trim() || DEFAULT_COOKIES;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="Cookie Policy"
      version={version}
      updatedAt={updatedAt}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
