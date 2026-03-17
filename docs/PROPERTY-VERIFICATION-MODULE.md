# Property Verification Module (LECIPM)

Database schema and API endpoints for verifying that property listings are created only by legitimate owners or authorized licensed brokers. The platform does **not** access land registry systems; users upload their own land register extract.

---

## 1. Database schema (conceptual)

### users
- `id` (PK), `name`, `email`, `password_hash`, `role`, `phone`, `created_at`, `updated_at`  
- Implemented as Prisma `User`; `phone` and `password_hash` mapped where applicable.

### bnhub_listings
- `id` (PK), `host_id` (FK users.id), `title`, `description`, `property_type`, `room_type`, `address`, `city`, `province`, `country`, `latitude`, `longitude`, `cadastre_number`, `listing_authority_type`, `verification_status`, `created_at`, `updated_at`
- `listing_authority_type`: owner | broker  
- `verification_status`: draft | pending_verification | pending_documents | verified | rejected  
- Implemented as Prisma `ShortTermListing` with `@@map("bnhub_listings")` and `ownerId` `@map("host_id")`.

### property_documents
- `id` (PK), `listing_id` (FK bnhub_listings.id), `document_type`, `file_url`, `cadastre_number`, `owner_name`, `uploaded_by`, `uploaded_at`
- `document_type`: land_registry_extract | broker_authorization

### identity_verifications
- `id` (PK), `user_id` (FK users.id), `government_id_file`, `selfie_photo`, `verification_status`, `verified_at`  
- `verification_status`: pending | verified | rejected

### broker_verifications
- `id` (PK), `user_id` (FK users.id), `license_number`, `brokerage_company`, `verification_status`, `verified_at`

### property_location_validation
- `id` (PK), `listing_id` (FK bnhub_listings.id), `latitude`, `longitude`, `address`, `validation_status`, `validated_at`

### property_verifications
- `id` (PK), `listing_id` (FK bnhub_listings.id), `cadastre_number`, `verification_status`, `verified_by`, `verified_at`, `notes`

---

## 2. Indexes and duplicate protection

- Indexes: `cadastre_number`, `host_id` (ownerId), `listing_id` (on related tables), `verification_status` (on listings and verification tables).
- **Duplicate protection:** Only one active listing per `cadastre_number` (for owner listings). Enforced in application logic in `lib/verification/ownership.ts` (`checkDuplicateCadastre`).

---

## 3. API endpoints

### Listing submission
- **POST /api/listings**  
  Body: `title`, `description`, `address`, `city`, `province`, `cadastre_number`, `listing_authority_type` (owner | broker). Optional: `country`, `nightPriceCents`, `beds`, `baths`, `maxGuests`, `photos`, `amenities`, `houseRules`. Creates listing in draft with verification fields set.

### Upload land register document
- **POST /api/property-documents/upload** (multipart)  
  Fields: `listing_id`, `document_type` (land_registry_extract | broker_authorization), `file`. Optional: `cadastre_number`, `owner_name`.

### Identity verification
- **POST /api/identity-verification** (multipart)  
  Fields: `user_id` (optional; defaults to session), `government_id_file` (file), `selfie_photo` (file). At least one file required.

### Broker verification
- **POST /api/broker-verification** (JSON)  
  Body: `user_id` (optional), `license_number`, `brokerage_company`.

### Geo validation
- **POST /api/location-validation** (JSON)  
  Body: `listing_id`, `latitude`, `longitude`, `address`.

### Verification status
- **GET /api/listings/:id/verification**  
  Returns: `cadastre_number`, `verification_status`, `identity_verification`, `broker_verification`, `location_validation`.

### Admin verification
- **POST /api/admin/verify-listing** (JSON)  
  Body: `listing_id`, `verification_status` (verified | rejected), `notes` (optional). Admin-only in production.

---

## 4. Verification workflow

1. User submits listing (POST /api/listings) with cadastre_number and listing_authority_type.  
2. System requires cadastre_number (and optionally listing_authority_type).  
3. User uploads land register extract (POST /api/property-documents/upload).  
4. User completes identity verification (POST /api/identity-verification).  
5. If broker, broker license is submitted (POST /api/broker-verification) and authorization document uploaded.  
6. Property location is validated (POST /api/location-validation).  
7. User submits for verification (existing flow: POST /api/verification/submit).  
8. Admin or AI verifies documents; admin calls POST /api/admin/verify-listing (or approve/reject via dashboard).  
9. Listing becomes verified and can be published.

---

## 5. Verified Property badge

When `verification_status` = verified (and triple verification passes: cadastre + identity/broker + location), the listing detail page shows a **Verified Property** badge: cadastre confirmed, identity confirmed, location validated.

---

## 6. Fraud prevention

Listings are flagged when:
- Cadastre numbers are duplicated (one active listing per cadastre for owners).  
- Owner name on document mismatches verified identity.  
- Location mismatches cadastre document (distance beyond tolerance).  
- Multiple listings exist for the same property (same cadastre).  

Implemented in `lib/verification/fraud-flags.ts` and used on submit.

---

## 7. Security

- **Document storage:** Uploads stored under `public/uploads/` (property-documents, identity-documents); in production use S3 or similar with signed URLs.  
- **Role-based access:** Only listing host can upload documents and submit location validation; admin endpoints must enforce admin role in production.  
- **Admin audit:** Verification decisions stored in `property_verifications` (verified_by, verified_at, notes); `lib/verification/audit.ts` provides a placeholder for extended admin audit logs.  
- **Document access:** Documents are served by URL; restrict access in production (e.g. signed URLs, auth middleware for private storage).
