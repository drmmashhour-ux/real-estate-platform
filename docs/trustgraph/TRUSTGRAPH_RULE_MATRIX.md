# TrustGraph — rule matrix

Rules execute in **pipeline order** in `lib/trustgraph/infrastructure/services/verificationPipeline.ts`. Each rule returns a `RuleEvaluationResult`: `ruleCode`, `ruleVersion`, `passed`, `scoreDelta`, `confidence`, `details`, optional `signals[]`, optional `recommendedActions[]`.

Canonical FSBO listing rule codes: `lib/trustgraph/domain/rules.ts` (`TRUSTGRAPH_FSBO_LISTING_RULE_CODES`).

---

## Phase 1 rule pack — conceptual ID → implementation

Product names below map to **implemented** `rule_code` values in `verification_rule_results`. Where a product ID is not a 1:1 row yet, behavior is covered by the grouped rule.

### Listing / address / type / media

| Product rule ID | Implemented `rule_code` | Intent |
|-----------------|-------------------------|--------|
| ADDRESS_REQUIRED_FIELDS_RULE | `address_consistency` | Address/city/unit consistency; missing unit for condo-style types |
| CONDO_UNIT_REQUIRED_RULE | `address_consistency` / `listing_type_consistency` | Unit number when property type implies multi-unit |
| ADDRESS_STRUCTURE_CONSISTENCY_RULE | `address_consistency` | Incomplete or inconsistent address composition |
| PROPERTY_TYPE_METADATA_MATCH_RULE | `listing_type_consistency` | Property type vs title/description/declaration |
| LISTING_TEXT_TYPE_MATCH_RULE | `listing_type_consistency` | Text vs structured `propertyType` |
| PHOTO_MINIMUM_RULE | `media_completeness` | Minimum photos / plan limits |
| EXTERIOR_FRONT_REQUIRED_RULE | `media_completeness` | Exterior tag / front photo expectation |
| FREE_PLAN_PHOTO_LIMIT_RULE | `media_completeness` | `getFsboMaxPhotosForSellerPlan` vs image count |
| SUPPORTED_UPLOAD_TYPE_RULE | FSBO upload routes + `config/uploads.ts` | MIME validation at upload (parallel to TrustGraph) |
| DUPLICATE_MEDIA_HASH_RULE | `duplicate_media` | `MediaContentFingerprint` cross-listing hash match |
| SUSPICIOUS_PRICE_RULE | `suspicious_pricing` | Heuristic vs list price |

### Seller declaration

| Product rule ID | Implemented `rule_code` | Intent |
|-----------------|-------------------------|--------|
| SELLER_DECLARATION_REQUIRED_SECTIONS_RULE | `seller_declaration_completeness` | Sections from `seller-declaration-schema` |
| SELLER_DECLARATION_CONTRADICTION_RULE | `seller_declaration_completeness` | Contradictory answers (where encoded) |
| SELLER_DECLARATION_MANDATORY_FIELDS_RULE | `seller_declaration_completeness` | Blocking fields before approval |

### Broker (when BROKER entity pipeline is run)

| Product rule ID | Stub / file | Intent |
|-----------------|-------------|--------|
| BROKER_LICENSE_PRESENT_RULE | `broker_license_presence` | License + brokerage fields |
| BROKER_CONTACT_COMPLETENESS_RULE | `broker_license_presence` (combined checks) | Phone/email/name |
| BROKERAGE_INFO_PRESENT_RULE | same | Agency string |
| BROKER_ADMIN_BADGE_ELIGIBILITY_RULE | product policy + `BrokerVerification` | Admin verified badge |

### Phase 2+ (entity types exist; pipeline may be listing-only today)

| Area | Rule files | Entity |
|------|------------|--------|
| Booking risk | `bookingRiskRule.ts` | `BOOKING` |
| Rental application | `rentalApplicationCompletenessRule.ts` | `RENTAL_APPLICATION` |
| Mortgage file | `mortgageFileCompletenessRule.ts` | `MORTGAGE_FILE` |
| Ownership proof | `ownershipProofPresenceRule.ts` | listing/docs linkage |
| Identity document | `identityDocumentPresenceRule.ts` | identity |

---

## Signal ↔ next best action (examples)

Failures should emit **signals** (`VerificationSignal`) and **next best actions** (`NextBestAction`) with stable `action_code` strings for UX and admin.

| Signal theme | Example `signal_code` | Example `action_code` |
|----------------|------------------------|------------------------|
| Condo unit missing | `CONDO_UNIT_MISSING` | `ADD_UNIT_NUMBER` |
| No exterior photo | `MISSING_EXTERIOR_PHOTO` | `UPLOAD_EXTERIOR_FRONT_PHOTO` |
| Declaration incomplete | `DECLARATION_INCOMPLETE` | `COMPLETE_SELLER_DECLARATION_SECTION` |
| Broker license missing | `BROKER_LICENSE_MISSING` | `UPLOAD_OR_ENTER_LICENSE_INFO` |
| Duplicate media | `DUPLICATE_MEDIA_ACROSS_LISTINGS` | `ADMIN_REVIEW_DUPLICATE_MEDIA` |

Exact strings are defined in rule modules and persisted on the case.

---

## Feature flag gating (UX only)

| Surface | Flag |
|---------|------|
| Pipeline on hub save | `TRUSTGRAPH_ENABLED` |
| Admin queue & queue API | `TRUSTGRAPH_ADMIN_QUEUE_ENABLED` (defaults on when master on) |
| Listing badge / panel | `TRUSTGRAPH_LISTING_BADGE_ENABLED` |
| Declaration widget | `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED` |
| Broker chip | `TRUSTGRAPH_BROKER_BADGE_ENABLED` |

---

## Versioning

- `TRUSTGRAPH_RULE_VERSION` in `lib/trustgraph/config.ts` is stored on each `VerificationRuleResult` for audit and replay.
