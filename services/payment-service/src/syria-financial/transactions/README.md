# Syria Transactions Module

Provider-agnostic transaction engine for future Syrian payment rails.

- Stores transaction lifecycle state only; it does not execute payments.
- Runtime-validates statuses: `pending`, `authorized`, `processing`, `completed`, `failed`, `refunded`, `cancelled`, `disputed`.
- Requires idempotency-ready references, correlation IDs, metadata, timestamps, and an audit trail.
- Rejects raw card-data metadata and invalid state transitions.
