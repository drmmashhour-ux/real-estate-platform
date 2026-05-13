# Syria Wallet Module

Internal wallet foundation for future Syrian settlement flows.

- Tracks `available`, `pending`, `payout`, `refund`, and `hold` balances.
- Uses immutable transaction references for ledger-ready accounting.
- Keeps balances internal; public preview snapshots omit balance values.
- Performs no real transfers and exposes no customer-facing money movement.
