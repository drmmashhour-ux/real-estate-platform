# Syria Financial Audit Module

Immutable audit-log foundation for future financial operations.

- Tracks payment attempts, payout attempts, verification changes, admin actions, suspicious events, provider failures, and API failures.
- Requires actor and correlation ID on every event.
- Sanitizes secrets and rejects raw card metadata.
- Emits append-only records; no update helpers are provided.
