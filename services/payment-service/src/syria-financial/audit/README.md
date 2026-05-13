# Syria Financial Audit Logs

The audit module creates immutable log records for payment attempts, payout attempts, verification changes, admin actions, suspicious events, provider failures, and API failures.

Audit logs include actor, timestamp, request correlation ID, target ID, and redacted metadata. Raw card data, secrets, and public stack traces are not stored.
