# Co-Ownership Compliance System (Harden Edition)

This document describes the compliance engine for divided co-ownership (Condos) in Québec, updated for the 2025 regulations and legal safety hardening.

## Goal
To ensure that all co-ownership properties listed on the platform meet mandatory disclosure and insurance requirements, reducing legal exposure for brokers and the platform.

## Checklist Definitions
The system uses a merged checklist of ~30 items covering:
- **Legal & Co-ownership**: Certificate of co-ownership condition, maintenance logs, contingency funds.
- **Insurance**: Syndicate property insurance, third-party liability, and co-owner liability minimums.

## Verification Layer
Each checklist item now supports multiple verification levels:
1. **DECLARED**: Broker/Seller has checked the box without evidence.
2. **DOCUMENTED**: Evidence has been uploaded (insurance certificate, etc.).
3. **VERIFIED**: Human or AI verification of the document has been completed.

### Hardening Rules
- **Insurance Gate**: Critical insurance rows (syndicate building, syndicate liability, co-owner liability) require at least **DOCUMENTED** level to pass compliance when `FEATURE_COOWNERSHIP_VERIFICATION_ENFORCEMENT` is on.
- **Expiry Tracking**: Items like insurance policies have a `validUntil` date. If expired, they block compliance if `FEATURE_COOWNERSHIP_EXPIRY_ENFORCEMENT` is on.

## Enforcement Flow
Enforcement occurs during:
1. **Publishing**: Listings cannot be published if compliance is incomplete.
2. **Offer Acceptance**: Offers cannot be accepted on incomplete listings.
3. **Autopilot**: The Autonomous Marketing Engine skips listings that fail compliance.

## Audit Model
All changes are logged in the `CoOwnershipAuditLog` table, including:
- **Actor**: Who made the change.
- **Event**: What changed (status update, verification upgrade, override).
- **Before/After Values**: For full traceability.
- **Reason**: Especially for admin overrides.

## Admin Overrides
In exceptional cases, admins can override a compliance block. This requires a mandatory reason and is permanently recorded in the audit trail.

## Feature Flags
- `FEATURE_COOWNERSHIP_COMPLIANCE_ENFORCEMENT`: Blocks on critical checklist keys.
- `FEATURE_COOWNERSHIP_VERIFICATION_ENFORCEMENT`: Blocks if critical keys are only DECLARED.
- `FEATURE_COOWNERSHIP_EXPIRY_ENFORCEMENT`: Blocks if critical keys are expired.
