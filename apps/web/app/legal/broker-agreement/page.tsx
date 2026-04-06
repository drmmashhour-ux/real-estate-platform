import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const DEFAULT_BROKER = `
<h2>1. Scope</h2>
<p>This Broker Agreement applies to licensed real estate professionals who join the platform to list properties, represent clients, and receive referrals or commissions.</p>

<h2>2. Eligibility</h2>
<p>You must hold a valid real estate license in the jurisdiction where you operate. You represent that your license is in good standing and you will comply with all applicable regulations.</p>

<h2>3. Listings and Clients</h2>
<p>You are responsible for the accuracy of listings you publish and for your client relationships. The platform does not replace your professional obligations or fiduciary duties.</p>

<h2>4. Fees and Commissions</h2>
<p>Commission splits, referral fees, and platform fees are as agreed in separate agreements or as displayed in your dashboard. Payment terms are subject to our general payment policies.</p>

<h2>5. Contact</h2>
<p>Broker support: dr.m.mashhour@gmail.com</p>
`;

export default async function BrokerAgreementPage() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT);
  const content = doc?.content?.trim() || DEFAULT_BROKER;
  const version = doc?.version ?? null;
  const updatedAt = doc?.createdAt ?? null;

  return (
    <LegalPageLayout
      title="Broker Agreement"
      version={version}
      updatedAt={updatedAt}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </LegalPageLayout>
  );
}
