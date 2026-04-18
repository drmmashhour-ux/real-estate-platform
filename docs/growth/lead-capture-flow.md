# Lead capture flow — early conversion funnel

## Direct path (primary)

1. Prospect lands on **`/get-leads`** (redirects to **`/en/ca/get-leads`** — adjust locale/country as needed).
2. Primary CTA: **Get Leads Now** — scrolls to the inline form.
3. They submit **name**, **email and/or phone**, **property link or address**, optional **notes**.
4. Submission is stored as a **`FormSubmission`** with `formType: early_conversion_lead` and appears in admin tooling that lists form submissions / growth workflows you already use.
5. If outbound email is configured, an **admin notification** email is sent (same pattern as other form submissions).

## Fallback path (secondary)

- **WhatsApp / DM:** Secondary CTA uses a link from **`NEXT_PUBLIC_GROWTH_WHATSAPP_URL`** (or your team’s preferred messenger URL). If unset, the button can fall back to **`mailto:`** using the platform support/contact address from config.
- Prospects who prefer chat send the listing link there; you log them manually in your sheet or CRM.

## Where leads go

- **Database:** `FormSubmission` row with `payloadJson` containing phone (if not in `clientEmail`), property link/address, notes, and `source: get_leads_landing`.
- **Email:** Admin inbox when Resend/notification email is configured (best-effort; same as `/api/forms` submissions).

## What happens after submission

1. User sees an inline **thank-you** message (no fake queue position).
2. You (or ops) follow up within your SLA — call, email, or WhatsApp depending on what they provided.
3. Next step in sales: confirm property details, set expectations on “qualified,” and use **`docs/growth/outreach-scripts.md`** + **`docs/growth/early-revenue-playbook.md`**.

## Environment placeholders

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GROWTH_WHATSAPP_URL` | Optional `https://wa.me/...` or similar for the secondary CTA. |

No Stripe changes are required for this capture path.
