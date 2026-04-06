# Email configuration (professional system)

All email behaviour is driven by **environment variables**. No addresses or API keys are hardcoded.

## Required in `.env`

| Variable | Purpose | Example |
|----------|---------|--------|
| `RESEND_API_KEY` | Resend API key for sending | Your key from resend.com |
| `EMAIL_FROM` | Sender shown to recipients | `LECIPM <dr.m.mashhour@gmail.com>` |

## Optional (recommended for direct reply)

| Variable | Purpose | Example |
|----------|---------|--------|
| `BROKER_EMAIL` | Where lead/reservation notifications are sent (team inbox) | `dr.m.mashhour@gmail.com` |
| `EMAIL_REPLY_TO` | Reply-To on client confirmation so client replies go to your inbox | `dr.m.mashhour@gmail.com` |

## Behaviour

- **Lead/reservation notifications** are sent to `BROKER_EMAIL` (or derived from `EMAIL_REPLY_TO` / `EMAIL_FROM`). They use **Reply-To: client’s email** so that when you click Reply in your inbox, the reply goes to the client.
- **Client confirmation** is sent to the client with **Reply-To: `EMAIL_REPLY_TO`** so that when the client clicks Reply, it goes to your inbox.
- If `RESEND_API_KEY` is missing or invalid, emails are **logged to the console** and the app **does not crash**.

## Templates

- Lead notification: *New Client Inquiry – LECIPM*
- Reservation notification: *New Unit Reservation Request*
- Client confirmation: *Thank You for Your Inquiry – LECIPM*

All use a professional, polite, luxury real-estate tone.
