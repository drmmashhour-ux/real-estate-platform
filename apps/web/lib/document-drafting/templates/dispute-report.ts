/**
 * Dispute Case Report template.
 */
export const DISPUTE_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Dispute Case Report</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Dispute Case Report</h1>
  <p><strong>Dispute ID:</strong> {{dispute_id}}</p>
  <p><strong>Booking ID:</strong> {{booking_id}}</p>
  <p><strong>Status:</strong> {{dispute_status}}</p>
  <p>Generated on {{generated_date}}.</p>
  <h2>Claimant</h2>
  <p>{{claimant}} – {{claimant_user_id}}</p>
  <h2>Description</h2>
  <p>{{description}}</p>
  {{#if complaint_category}}<p><strong>Category:</strong> {{complaint_category}}</p>{{/if}}
  <h2>Listing</h2>
  <p>{{listing_address}}</p>
  <h2>Resolution</h2>
  {{#if resolution_outcome}}<p><strong>Outcome:</strong> {{resolution_outcome}}</p>{{/if}}
  {{#if refund_cents}}<p><strong>Refund:</strong> {{refund_amount}}</p>{{/if}}
  {{#if resolution_notes}}<p>{{resolution_notes}}</p>{{/if}}
</body>
</html>
`.trim();
