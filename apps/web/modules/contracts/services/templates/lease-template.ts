/**
 * Québec-style residential short-term lease template (HTML).
 * Placeholders filled at generation time. Counsel review recommended before production reliance.
 */

export type LeaseParty = {
  name: string;
  email: string;
};

export type LeaseTemplateInput = {
  /** Listing / property */
  propertyAddress: string;
  city: string;
  region?: string | null;
  province: string;
  country: string;
  listingTitle: string;
  listingCode?: string | null;
  /** Term */
  leaseStart: string;
  leaseEnd: string;
  rentAmountDisplay: string;
  rentCadence: string;
  paymentMethod: string;
  securityDepositDisplay: string;
  /** Parties */
  landlord: LeaseParty;
  tenant: LeaseParty;
  broker?: LeaseParty | null;
  /** Meta */
  generatedAtIso: string;
  contractReference: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLeaseTemplateHtml(input: LeaseTemplateInput): string {
  const brokerSection =
    input.broker && input.broker.name.trim()
      ? `
  <section class="sec">
    <h2>Broker / intermediary (optional)</h2>
    <p>This listing may be offered by a licensed real estate broker. Broker: <strong>${esc(input.broker.name)}</strong> (${esc(input.broker.email)}).</p>
    <p>Where applicable, the broker acts in accordance with OACIQ rules. The platform (LECIPM) remains an intermediary for technology and booking services unless otherwise agreed in writing.</p>
  </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Residential Lease Agreement — ${esc(input.contractReference)}</title>
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.45; max-width: 800px; margin: 0 auto; padding: 24px;">
  <header style="border-bottom: 2px solid #C9A646; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="margin:0; font-size: 11px; letter-spacing: 0.12em; color: #666;">LECIPM · Mashhour Investments</p>
    <h1 style="margin: 8px 0 0; font-size: 1.5rem;">Residential Lease Agreement</h1>
    <p style="margin: 8px 0 0; font-size: 13px; color: #444;">Reference: <strong>${esc(input.contractReference)}</strong> · Generated ${esc(input.generatedAtIso)}</p>
  </header>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">1. Parties</h2>
    <p><strong>Landlord:</strong> ${esc(input.landlord.name)} (${esc(input.landlord.email)})</p>
    <p><strong>Tenant:</strong> ${esc(input.tenant.name)} (${esc(input.tenant.email)})</p>
  </section>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">2. Property</h2>
    <p><strong>Premises:</strong> ${esc(input.listingTitle)}</p>
    <p><strong>Address:</strong> ${esc(input.propertyAddress)}, ${esc(input.city)}${input.region ? `, ${esc(input.region)}` : ""}, ${esc(input.province)}, ${esc(input.country)}</p>
    ${input.listingCode ? `<p><strong>Listing ID:</strong> ${esc(input.listingCode)}</p>` : ""}
  </section>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">3. Lease term &amp; rent</h2>
    <p><strong>Start:</strong> ${esc(input.leaseStart)} &nbsp;|&nbsp; <strong>End:</strong> ${esc(input.leaseEnd)}</p>
    <p><strong>Rent:</strong> ${esc(input.rentAmountDisplay)} (${esc(input.rentCadence)})</p>
    <p><strong>Payment method:</strong> ${esc(input.paymentMethod)}</p>
    <p><strong>Security deposit (if any):</strong> ${esc(input.securityDepositDisplay)}</p>
  </section>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">4. Deposit &amp; conditions</h2>
    <p>Any deposit is held subject to the cancellation policy and house rules published on the listing for the applicable booking dates. The tenant acknowledges receipt of material disclosures made available on the platform.</p>
  </section>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">5. Responsibilities</h2>
    <p><strong>Tenant obligations:</strong> Pay rent on time; use the premises lawfully; follow house rules; report damage; do not sublet without written consent.</p>
    <p><strong>Landlord obligations:</strong> Provide the premises in agreed condition; respect applicable housing and safety laws; maintain required insurance as applicable.</p>
  </section>
  ${brokerSection}

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">6. Governing law &amp; electronic signature</h2>
    <p>This agreement is governed by the laws applicable in the Province of Québec and the laws of Canada.</p>
    <p><strong>Electronic signature:</strong> The parties intend to sign electronically. This electronic signature is legally binding under applicable Québec laws, including the Act to establish a legal framework for information technology (CQLR c. C-1.1) and related requirements, to the extent they apply.</p>
    <p><strong>Platform role:</strong> LECIPM provides document generation and signing tools only and is not a party to this lease unless expressly stated in a separate instrument.</p>
  </section>

  <section class="sec">
    <h2 style="font-size: 1.1rem; color: #B8860B;">7. Signature blocks</h2>
    <p>Signatures are recorded on the LECIPM platform with name, email, timestamp, and IP address for audit purposes.</p>
    <p style="margin-top: 48px;">Landlord: __________________________ &nbsp; Date: __________</p>
    <p style="margin-top: 36px;">Tenant: __________________________ &nbsp; Date: __________</p>
    ${input.broker?.name ? `<p style="margin-top: 36px;">Broker (if applicable): __________________________ &nbsp; Date: __________</p>` : ""}
  </section>

  <footer style="margin-top: 48px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px;">
    <p>© ${new Date().getFullYear()} LECIPM (Mashhour Investments). All rights reserved.</p>
  </footer>
</body>
</html>`;
}
