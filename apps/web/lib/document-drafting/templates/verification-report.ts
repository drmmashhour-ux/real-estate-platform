/**
 * Property Verification Report template.
 */
export const VERIFICATION_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Property Verification Report</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Property Verification Report</h1>
  <p>Generated on {{generated_date}}.</p>
  <h2>Property</h2>
  <p><strong>Address:</strong> {{property_address}}</p>
  <p><strong>Cadastre:</strong> {{cadastre_number}}</p>
  <p><strong>Municipality:</strong> {{municipality}}, {{province}}</p>
  <h2>Ownership</h2>
  {{#each owners}}
  <p>{{ownerName}} (Source: {{ownerSource}})</p>
  {{/each}}
  <h2>Verification status</h2>
  <p><strong>Score:</strong> {{verification_score}}</p>
  <p>This report is for internal and authorized use only.</p>
</body>
</html>
`.trim();
