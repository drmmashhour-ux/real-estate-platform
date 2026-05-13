# Syria Payment Events Module

Provider event normalization for future Syrian payment rails.

- Records payment-intent, verification, payout, webhook, health, and failure events.
- Keeps provider payloads in sanitized metadata only.
- Does not register public webhooks or trust provider callbacks yet.
- Designed for correlation with financial audit logs.
