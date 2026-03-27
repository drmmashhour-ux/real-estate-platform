/**
 * Notary-ready document templates – placeholders filled from transaction data.
 */

export const OFFER_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Offer to Purchase</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Offer to Purchase</h1>
<p><strong>Date:</strong> {{generated_date}}</p>
<hr/>
<h2>Property</h2>
<p><strong>Address:</strong> {{property_address}}</p>
<p><strong>Municipality:</strong> {{property_municipality}}, {{property_province}} {{property_country}}</p>
<p><strong>Cadastre:</strong> {{cadastre_number}}</p>
<h2>Parties</h2>
<p><strong>Buyer:</strong> {{buyer_name}} ({{buyer_email}})</p>
<p><strong>Seller:</strong> {{seller_name}} ({{seller_email}})</p>
{{#if broker_name}}<p><strong>Broker:</strong> {{broker_name}} ({{broker_email}})</p>{{/if}}
<h2>Terms</h2>
<p><strong>Purchase Price:</strong> {{offer_price}}</p>
<p><strong>Transaction Status:</strong> {{transaction_status}}</p>
<p><em>Notary-ready draft. Not legally binding until signed.</em></p>
</body></html>
`;

export const PROPERTY_SHEET_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Property Information Sheet</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Property Information Sheet</h1>
<p><strong>Generated:</strong> {{generated_date}}</p>
<hr/>
<p><strong>Address:</strong> {{property_address}}</p>
<p><strong>Municipality:</strong> {{property_municipality}}, {{property_province}} {{property_country}}</p>
<p><strong>Cadastre:</strong> {{cadastre_number}}</p>
<p><em>For notary review.</em></p>
</body></html>
`;

export const BUYER_INFO_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Buyer Information</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Buyer Information</h1>
<p><strong>Name:</strong> {{buyer_name}}</p>
<p><strong>Email:</strong> {{buyer_email}}</p>
<p><em>Transaction: {{transaction_id}}</em></p>
</body></html>
`;

export const SELLER_INFO_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Seller Information</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Seller Information</h1>
<p><strong>Name:</strong> {{seller_name}}</p>
<p><strong>Email:</strong> {{seller_email}}</p>
<p><em>Transaction: {{transaction_id}}</em></p>
</body></html>
`;

export const BROKER_DETAILS_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Broker Details</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Broker Details</h1>
{{#if broker_name}}
<p><strong>Name:</strong> {{broker_name}}</p>
<p><strong>Email:</strong> {{broker_email}}</p>
{{#each broker_authorizations}}
<p><strong>License / Brokerage:</strong> {{this.broker_license}} – {{this.brokerage_name}}</p>
{{/each}}
{{else}}
<p>No broker assigned to this transaction.</p>
{{/if}}
<p><em>Transaction: {{transaction_id}}</em></p>
</body></html>
`;

export const TRANSACTION_SUMMARY_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Transaction Summary</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Transaction Summary</h1>
<p><strong>Date:</strong> {{generated_date}}</p>
<p><strong>Transaction ID:</strong> {{transaction_id}}</p>
<p><strong>Status:</strong> {{transaction_status}}</p>
<hr/>
<h2>Property</h2>
<p>{{property_address}}, {{property_municipality}} {{property_province}}</p>
<h2>Parties</h2>
<p><strong>Buyer:</strong> {{buyer_name}}</p>
<p><strong>Seller:</strong> {{seller_name}}</p>
{{#if broker_name}}<p><strong>Broker:</strong> {{broker_name}}</p>{{/if}}
<h2>Financial</h2>
<p><strong>Offer Price:</strong> {{offer_price}}</p>
</body></html>
`;

export const PAYMENT_SUMMARY_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payment and Escrow Summary</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Payment and Escrow Summary</h1>
<p><strong>Generated:</strong> {{generated_date}}</p>
<p><strong>Transaction ID:</strong> {{transaction_id}}</p>
<hr/>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="padding:8px;"><strong>Purchase Price</strong></td><td style="padding:8px;">{{purchase_price}}</td></tr>
<tr><td style="padding:8px;"><strong>Deposit Amount</strong></td><td style="padding:8px;">{{deposit_amount}}</td></tr>
<tr><td style="padding:8px;"><strong>Remaining Balance</strong></td><td style="padding:8px;">{{remaining_balance}}</td></tr>
<tr><td style="padding:8px;"><strong>Escrow Status</strong></td><td style="padding:8px;">{{escrow_status}}</td></tr>
</table>
<p><em>For notary review.</em></p>
</body></html>
`;

export const OWNERSHIP_VERIFICATION_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Ownership Verification Report</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Ownership Verification Report</h1>
<p><strong>Date:</strong> {{generated_date}}</p>
<p><strong>Property:</strong> {{property_address}}</p>
<hr/>
<h2>Registered Owners (platform data)</h2>
{{#each owners}}
<p><strong>Owner:</strong> {{this.ownerName}} | Source: {{this.source}} | Current: {{this.isCurrent}}</p>
{{/each}}
{{#if owner_name}}<p>Primary owner name: {{owner_name}}</p>{{/if}}
<p><em>This report reflects platform verification at time of generation. Notary must verify with land register.</em></p>
</body></html>
`;

export const BROKER_AUTHORIZATION_TEMPLATE = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Broker Authorization Summary</title></head><body style="font-family: serif; max-width: 700px; margin: 2rem auto; padding: 1rem;">
<h1>Broker Authorization Summary</h1>
<p><strong>Date:</strong> {{generated_date}}</p>
<p><strong>Property:</strong> {{property_address}}</p>
<hr/>
{{#each broker_authorizations}}
<p><strong>Authority:</strong> {{this.authorityType}}</p>
<p>Broker: {{this.broker_name}} | License: {{this.broker_license}} | Brokerage: {{this.brokerage_name}}</p>
<p>Authorized by owner: {{this.owner_name}} | Period: {{this.start}} – {{this.end}}</p>
<hr/>
{{/each}}
{{#if broker_name}}<p>Transaction broker: {{broker_name}}</p>{{/if}}
<p><em>For notary review.</em></p>
</body></html>
`;

export const CLOSING_TEMPLATES: Record<string, string> = {
  offer: OFFER_TEMPLATE,
  property_sheet: PROPERTY_SHEET_TEMPLATE,
  buyer_info: BUYER_INFO_TEMPLATE,
  seller_info: SELLER_INFO_TEMPLATE,
  broker_details: BROKER_DETAILS_TEMPLATE,
  transaction_summary: TRANSACTION_SUMMARY_TEMPLATE,
  payment_summary: PAYMENT_SUMMARY_TEMPLATE,
  ownership_verification: OWNERSHIP_VERIFICATION_TEMPLATE,
  broker_authorization: BROKER_AUTHORIZATION_TEMPLATE,
};
