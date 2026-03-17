# Property Ownership Verification (LECIPM) — Triple Verification System

This document describes the **Triple Property Verification** workflow for the LECIPM platform. The goal is to prevent fraudulent listings by verifying that the lister is either the **legal owner** or an **authorized licensed broker**, through three combined checks:

1. **Cadastre / land register verification** — Official extract uploaded by the lister; cadastre number and owner name checked.
2. **Identity verification** — Government ID and selfie; name must match owner name on document when authority = owner.
3. **Geo-location validation** — Property location (lat/long) must match cadastre address / municipality.

The platform does **not** call the land register API directly. Listers obtain the official extract themselves and upload it for verification.

---

## 1. Listing authority types

When creating or submitting a listing, the lister must choose:

- **`owner`** — They are the legal property owner.
- **`broker`** — They are a licensed broker authorized by the owner.

This is stored in `listing_authority_type` (enum: `OWNER` | `BROKER`).

---

## 2. Required property fields

All property listings must include:

- **`cadastre_number`** — Validated format (Québec-style: alphanumeric, spaces, hyphens, fractions allowed).
- **`municipality`**
- **`province`**
- **`address`**

Validation is applied before submission for verification (see `lib/verification/cadastre.ts`).

---

## 3. Land register extract upload

- **Accepted format:** PDF only.
- **Document types:**
  - `land_registry_extract` — Official land register extract (cadastre number, owner name, property address).
  - `broker_authorization` — Required when `listing_authority_type = broker`.

Stored in table **`property_documents`**:

- `id`, `listing_id`, `document_type`, `file_url`, `cadastre_number`, `owner_name` (optional, from AI or manual extract), `uploaded_by`, `uploaded_at`.

Upload API: **`POST /api/verification/documents/upload`** (multipart: `listingId`, `documentType`, `file`, optional `cadastreNumber`, `ownerName`).

---

## 4. Identity verification (triple check 2)

- **Table:** `identity_verifications` — `user_id`, `government_id_file`, `selfie_photo`, `verification_status`, `verified_at`.
- User uploads government ID and selfie via **`POST /api/verification/identity/upload`** (form: `kind`: government_id | selfie, `file`).
- Admin or verification service confirms identity; for **owner** listings, user name must match **owner_name** from land register document.

---

## 5. Broker license verification (triple check, when authority = broker)

- **Table:** `broker_verifications` — `user_id`, `license_number`, `brokerage_company`, `verification_status`, `verified_at`.
- **`POST /api/verification/broker/submit`** — body: `licenseNumber`, `brokerageCompany`. License format validated.
- Owner authorization document is required as a property_document (type `broker_authorization`); cadastre in that document is verified.

---

## 6. Geo-location validation (triple check 3)

- **Table:** `property_location_validation` — `listing_id`, `latitude`, `longitude`, `address`, `validation_status`, `validated_at`.
- On submit, a record is created from the listing’s address/coordinates. Geocode address and confirm coordinates match listing and municipality.
- Admin can verify on map (link in dashboard) and set status to VERIFIED.

---

## 7. Owner verification flow

When `listing_authority_type = owner`:

- **Required:** government ID (handled elsewhere if needed), **land register extract**, **cadastre number**.
- **Verification logic:**
  1. Cadastre number from document is compared with listing `cadastre_number`.
  2. Owner name on document is compared with user name.
  3. Listing status is set to `pending_verification` → then `verified` or `rejected` by admin.

---

## 8. Broker verification flow (summary)

When `listing_authority_type = broker`:

- **Required:** `broker_license_number`, `brokerage_name`, **broker authorization document**, **land register extract**.
- **Verification logic:**
  1. Broker license number and brokerage name are stored and reviewed.
  2. Authorization document and land register extract are checked.
  3. Cadastre number must match listing; owner name must appear in registry extract.

---

## 9. Duplicate listing prevention

- **Rule:** One active listing per `cadastre_number` per listing type when authority is **owner** (unless broker authorization exists).
- Implemented in application logic in `lib/verification/ownership.ts` (`checkDuplicateCadastre`). No unique DB index on cadastre alone, because brokers can have multiple listings for the same cadastre.

---

## 10. Document review (admin)

- **Admin verification dashboard:** `/admin/verifications`
- Admins can:
  - View pending listings and uploaded documents.
  - View cadastre number and listing address.
  - Approve or reject verification (with optional notes).

**Database:** `property_verifications` — `id`, `listing_id`, `cadastre_number`, `verification_status`, `verified_by`, `verified_at`, `notes`.

**APIs:**

- `GET /api/admin/verifications/pending` — List pending verifications (includes identity, broker, location).
- `POST /api/admin/verifications/[listingId]/approve` — Approve (sets cadastre, identity/broker, and location to VERIFIED).
- `POST /api/admin/verifications/[listingId]/reject` — Reject (optional notes).
- `POST /api/admin/verifications/[listingId]/request-more-documents` — Set status to PENDING_DOCUMENTS with reason; lister can resubmit.

**Admin dashboard** shows: cadastre number, land register document, identity verification (gov ID, selfie), broker license (if broker), map location link, then approve / reject / request more documents.

---

## 11. Verification status system

Listings use **`listing_verification_status`**:

- **`draft`** — Not yet submitted.
- **`pending_verification`** — Documents submitted, awaiting admin review.
- **`pending_documents`** — Admin requested more documents; lister can resubmit.
- **`verified`** — All three checks passed (cadastre + identity/broker + location).
- **`rejected`** — Verification failed.

Only **verified** listings can be set to **published** (enforced in `PUT/PATCH /api/bnhub/listings/[id]` via `canPublishListing()`). Publishing requires **triple verification**: cadastre, identity (or broker), and location all VERIFIED.

---

## 12. Verified Property badge

When a listing has passed **all three** checks (cadastre + identity/broker + location), listing detail pages show a **Verified Property** badge: “Cadastre verified; identity verified; location verified.” See `app/bnhub/[id]/page.tsx` (uses `isTripleVerified()`).

---

## 13. Optional AI assistance

- **`lib/verification/ai-extract.ts`** — Interface for extracting from PDF: cadastre number, owner name, address.
- **`POST /api/verification/documents/[documentId]/extract`** — Returns extracted data (cadastre_number, owner_name, address) and comparison with listing. Stub returns `null` until PDF + LLM are integrated.

---

## 14. Fraud prevention

Automatic flags (see `lib/verification/fraud-flags.ts`):

- Duplicate cadastre (owner); multiple listings for same property.
- Owner name does not match verified identity / account name.
- Multiple listings from same user (threshold configurable).
- Property location mismatches cadastre document (distance beyond tolerance).
- Results are returned on submit; can be used to block or queue for manual review.

---

## 15. Summary

- Only **verified** owners or **authorized brokers** can publish property listings.
- **Triple verification:** (1) cadastre + land register document, (2) identity (gov ID + selfie) or broker license + authorization, (3) geo-location validated.
- The platform does **not** access the land register API; it verifies documents provided by the lister.
- **Modular:** cadastre, identity, broker, geo-validation, document storage, admin workflow, and optional AI are separated and scalable.

---

## Running migrations

After setting `DATABASE_URL`, run:

```bash
cd apps/web-app && npx prisma migrate dev --name add_property_ownership_verification
```

This creates the `property_documents` (with `owner_name`), `property_verifications` (with request-more-documents fields), `identity_verifications`, `broker_verifications`, and `property_location_validation` tables, and adds the new listing fields (`listing_authority_type`, `listing_verification_status`, `cadastre_number`, `municipality`, `province`, broker fields, etc.).
