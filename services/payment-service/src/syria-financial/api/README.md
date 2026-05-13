# Syria Financial API Hardening Module

Shared contracts for future internal financial APIs.

- Provides correlation-ID and idempotency helpers.
- Defines a rate-limit policy namespace without registering public routes.
- Standardizes safe financial error responses.
- Expects route handlers to layer schema validation and provider isolation around every operation.
