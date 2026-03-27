/**
 * Transaction Summary template.
 */
export const TRANSACTION_SUMMARY_TEMPLATE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Transaction Summary</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; line-height: 1.5;">
  <h1>Transaction Summary</h1>
  <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
  <p><strong>Status:</strong> {{transaction_status}}</p>
  <p>Generated on {{generated_date}}.</p>
  <h2>Property</h2>
  <p>{{property_address}}</p>
  <h2>Parties</h2>
  <p><strong>Buyer:</strong> {{buyer_name}}</p>
  <p><strong>Seller:</strong> {{seller_name}}</p>
  {{#if broker_name}}<p><strong>Broker:</strong> {{broker_name}}</p>{{/if}}
  <h2>Financial</h2>
  <p><strong>Offer / purchase price:</strong> {{offer_price}}</p>
  <p><strong>Deposit received:</strong> {{deposit_amount}}</p>
  <p><strong>Remaining balance:</strong> {{remaining_balance}}</p>
</body>
</html>
`.trim();
