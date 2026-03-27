/**
 * Rental Agreement template (long-term).
 * Placeholders: property_address, tenant_name, tenant_email, landlord_name, landlord_email,
 * rent_amount, start_date, end_date, generated_date.
 */
export const RENTAL_AGREEMENT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Rental Agreement</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Rental Agreement</h1>
  <p><strong>Property:</strong> {{property_address}}</p>
  <p>Agreement generated on {{generated_date}}.</p>
  <h2>Parties</h2>
  <p><strong>Landlord:</strong> {{landlord_name}} ({{landlord_email}})</p>
  <p><strong>Tenant:</strong> {{tenant_name}} ({{tenant_email}})</p>
  <h2>Terms</h2>
  <p><strong>Rent:</strong> {{rent_amount}} per month</p>
  <p><strong>Term:</strong> {{start_date}} to {{end_date}}</p>
  <p>This document is a draft. It becomes binding when signed by both parties through the platform.</p>
</body>
</html>
`.trim();
