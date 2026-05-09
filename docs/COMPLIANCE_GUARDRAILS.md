# Compliance Guardrails

## Location

Compliance Engine lives at `apps/web/src/modules/compliance/`.

```
src/modules/compliance/
├── constants.ts        # Compliance codes (BROKER_REVIEW_REQUIRED, etc.)
├── types.ts            # ComplianceCheckResult, ComplianceGateResult, RegulatedAction
├── server/
│   └── checks.ts       # All compliance check functions
├── __tests__/
│   └── checks.test.ts  # Test coverage for compliance checks
└── README.md
```

## Functions

| Function | Purpose | Current State |
|---|---|---|
| `canPublishListing(listingId)` | Gate: can a listing be published? | Placeholder — returns blocking checks marked `TODO_COMPLIANCE_VERIFY` |
| `requiresBrokerReview(action)` | Does this action require broker sign-off? | Implemented for `accept_offer`, `sign_contract`, `submit_seller_declaration` |
| `missingRequiredForms(transactionId)` | Which required forms are missing? | Placeholder — returns TODO items |
| `auditSeverity(action)` | What severity level for auditing? | Implemented: `critical` for payments/contracts, `blocking` for offers, `warning` for listings |
| `blockingReasons(action)` | Get all blocking reasons for an action | Returns placeholder blocking reason (fail-closed) |

## Placeholder Rules

**ALL** placeholder rules are marked with `TODO_COMPLIANCE_VERIFY` in the source code.

This is intentional. No fake OACIQ rules have been invented. Every placeholder clearly states what is not yet implemented.

Current placeholder markers:
- `TODO_COMPLIANCE_VERIFY: Real OACIQ publication rules must be verified`
- `TODO_COMPLIANCE_VERIFY: Broker review thresholds must be defined`
- `TODO_COMPLIANCE_VERIFY: Required forms list varies by transaction type`
- `TODO_COMPLIANCE_VERIFY: Seller Declaration form check not implemented`
- `TODO_COMPLIANCE_VERIFY: OACIQ Disclosure form check not implemented`
- `TODO_COMPLIANCE_VERIFY: Full compliance check for '<action>' not yet implemented`

## Default Behavior: Fail-Closed

Unknown or unimplemented actions are **blocked by default**. The `blockingReasons()` function returns a blocking placeholder for any action, meaning:

- If the compliance engine does not know how to handle an action, it blocks it.
- This is safer than fail-open — no regulated action can slip through without an explicit rule.

## Feature Flags

| Flag | Default | Behavior |
|---|---|---|
| `FEATURE_COMPLIANCE` | ON | Enables the compliance engine. When OFF, compliance checks are bypassed (not recommended). |
| `FEATURE_COMPLIANCE_HARD_LOCK` | OFF | When ON, **ALL** regulated actions are blocked regardless of individual check results. Use during initial deployment before compliance has been reviewed. |

## Pre-Production Requirements

Before going to production, the following **must** happen:

1. Every `TODO_COMPLIANCE_VERIFY` must be reviewed and resolved by a **licensed compliance advisor** familiar with Quebec real estate regulations (OACIQ).
2. `FEATURE_COMPLIANCE_HARD_LOCK` should be set to `1` until the compliance review is complete.
3. Payment activation without compliance status verification = **blocked**.
4. Public marketing materials must **not** promise legal automation or regulatory compliance that has not been implemented and verified.

## Regulated Actions

Defined in `types.ts`:

| Action | Audit Severity |
|---|---|
| `publish_listing` | Warning |
| `accept_offer` | Blocking |
| `sign_contract` | Critical |
| `process_payment` | Critical |
| `onboard_host` | Warning |
| `submit_seller_declaration` | Blocking |
| `broker_assignment` | Warning |

## Compliance Codes

Defined in `constants.ts`:

| Code | Purpose |
|---|---|
| `BROKER_REVIEW_REQUIRED` | Action needs broker sign-off |
| `SELLER_DECLARATION_MISSING` | Seller declaration not filed |
| `IDENTITY_NOT_VERIFIED` | User identity check incomplete |
| `LISTING_INCOMPLETE` | Listing missing required fields |
| `OACIQ_DISCLOSURE_MISSING` | OACIQ disclosure not present |
| `HOST_TERMS_NOT_ACCEPTED` | Host terms of service not accepted |
| `PAYMENT_METHOD_MISSING` | No payment method on file |
| `UNKNOWN_REGULATED_ACTION` | Action not recognized (fail-closed) |

## Rules

1. No fake legal rules. If it is not implemented, mark it `TODO_COMPLIANCE_VERIFY`.
2. Fail-closed by default. Unknown = blocked.
3. No payment activation without compliance checks passing.
4. No public claims about legal automation that is not verified.
5. Every compliance check result carries an `isPlaceholder` flag so callers know it is not a real rule yet.
