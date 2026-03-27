/**
 * Broker Listing Agreement template.
 * Placeholders: property_address, owner_name, broker_name, broker_license, brokerage_name,
 * start_date, end_date, generated_date, listing_type.
 */
export const BROKER_LISTING_AGREEMENT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Broker Listing Agreement</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Broker Listing Agreement</h1>
  <p>Generated on {{generated_date}}.</p>
  <h2>Property</h2>
  <p>{{property_address}}</p>
  <h2>Parties</h2>
  <p><strong>Owner (Principal):</strong> {{owner_name}}</p>
  <p><strong>Broker:</strong> {{broker_name}}</p>
  <p><strong>License number:</strong> {{broker_license}}</p>
  <p><strong>Brokerage:</strong> {{brokerage_name}}</p>
  <h2>Authority</h2>
  <p><strong>Listing type:</strong> {{listing_type}}</p>
  <p><strong>Term:</strong> {{start_date}} to {{end_date}}</p>
  <p>This agreement authorizes the broker to list the property on the LECIPM platform. It is a draft until signed.</p>
</body>
</html>
`.trim();
