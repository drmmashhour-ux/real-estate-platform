/**
 * Investment Report template.
 */
export const INVESTMENT_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Investment Report</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Investment Report</h1>
  <p>Generated on {{generated_date}}.</p>
  <h2>Property</h2>
  <p>{{property_address}}</p>
  <p><strong>Property UID:</strong> {{property_uid}}</p>
  <h2>Valuation</h2>
  <p><strong>Estimated value:</strong> {{estimated_value}}</p>
  {{#if monthly_rent_estimate}}<p><strong>Monthly rent estimate:</strong> {{monthly_rent_estimate}}</p>{{/if}}
  {{#if investment_score}}<p><strong>Investment score:</strong> {{investment_score}}</p>{{/if}}
  {{#if gross_yield_estimate}}<p><strong>Gross yield estimate:</strong> {{gross_yield_estimate}}%</p>{{/if}}
  <p>This report is based on platform data and models. It does not constitute financial or investment advice.</p>
</body>
</html>
`.trim();
