# Syria Payouts Module

Payout preparation model for future Syrian merchant settlement.

- Builds payout plans only when `FEATURE_SYRIA_PAYOUTS=true`.
- Keeps destination references abstract and never stores raw bank credentials.
- Starts all payout plans as `pending`; no real transfer is sent.
- Designed for future provider adapters and admin review queues.
