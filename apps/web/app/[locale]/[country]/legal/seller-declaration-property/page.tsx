import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Seller declaration form (property) — reference",
  description:
    "Reference text for the BNHUB Seller Declaration: property identification, ownership, condition, renovations, legal status, inclusions, and signature.",
};

export default function SellerDeclarationPropertyReferencePage() {
  return (
    <LegalPageLayout title="Seller declaration form (property)" backHref="/legal">
      <div className="prose prose-invert max-w-none prose-headings:text-premium-gold prose-p:text-[#B3B3B3] prose-li:text-[#B3B3B3] prose-strong:text-[#E5E5E5]">
        <p className="text-sm text-[#9CA3AF]">
          This page is a readable reference for the declaration you complete in the host dashboard. The
          binding submission is the one you sign electronically there.
        </p>

        <h2 className="mt-8 text-lg font-semibold">1. Property identification</h2>
        <ul>
          <li>Property address</li>
          <li>Cadaster number</li>
          <li>Property type</li>
          <li>Year built</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">2. Ownership</h2>
        <p>I confirm that:</p>
        <ul>
          <li>I am the legal owner OR authorized to sell</li>
          <li>No hidden ownership exists</li>
          <li>Property is not under dispute</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">3. Property condition</h2>
        <p>I declare that, to the best of my knowledge:</p>
        <ul>
          <li>No hidden defects exist</li>
          <li>No water damage / infiltration</li>
          <li>No structural issues</li>
          <li>No pest infestation</li>
        </ul>
        <p>If any issue exists, I must declare it in the form.</p>

        <h2 className="mt-8 text-lg font-semibold">4. Work &amp; renovations</h2>
        <ul>
          <li>List any renovations done</li>
          <li>Were permits obtained? (yes / no)</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">5. Legal &amp; financial status</h2>
        <ul>
          <li>Any mortgage on property? (yes / no)</li>
          <li>Any legal issue or lien? (yes / no)</li>
          <li>If yes, explain</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">6. Inclusions / exclusions</h2>
        <ul>
          <li>Included in sale</li>
          <li>Excluded</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">7. Services &amp; conditions</h2>
        <ul>
          <li>Utilities (electricity, water, etc.)</li>
          <li>Condo fees (if applicable)</li>
          <li>Taxes</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">8. Declaration</h2>
        <p>I confirm that:</p>
        <ul>
          <li>All information is true</li>
          <li>Nothing has been intentionally hidden</li>
          <li>I understand that false declaration may result in legal liability</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold">9. Signature</h2>
        <ul>
          <li>I agree and sign this declaration</li>
          <li>Date and signature (collected electronically when you submit in the dashboard)</li>
        </ul>
      </div>
    </LegalPageLayout>
  );
}
