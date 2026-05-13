# Syria Merchant Verification Module

Merchant and KYC foundation for future Syrian financial operations.

- Models merchant profiles, KYC status, identity status, bank-account verification status, approval, rejection, and document references.
- Requires `FEATURE_SYRIA_KYC=true` before profile creation helpers operate.
- Stores secure document references only; it never exposes raw documents or public URLs.
- Admin approval and rejection are represented as workflow states, not automated compliance decisions.
