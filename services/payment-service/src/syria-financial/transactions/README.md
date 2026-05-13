# Syria Transaction Engine

The transaction engine is provider-agnostic and idempotency-ready. It supports only architecture-level transaction preparation and status transitions:

`pending`, `authorized`, `processing`, `completed`, `failed`, `refunded`, `cancelled`, `disputed`.

Transactions carry booking, payer, merchant, provider, amount, timestamps, metadata, idempotency key, and an immutable audit trail. No provider method in this module executes real payments.
