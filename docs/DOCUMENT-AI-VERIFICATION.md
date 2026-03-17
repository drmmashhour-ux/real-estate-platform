# AI Document Extraction and Automatic Property Verification

AI-assisted extraction and matching for land register documents. **The system does not auto-approve listings;** admins must confirm after reviewing extracted data and scores.

---

## 1. Document AI Service (`services/document-ai`)

**Structure:** `controllers/`, `services/`, `routes/`, `parsers/`, `models/`, `tests/`

- **PDF parsing:** Extract text from uploaded PDFs (`parsers/pdf-parser.ts`, uses `pdf-parse`).
- **Land register parser:** Regex-based extraction of:
  - `cadastre_number`
  - `owner_name`
  - `property_address`
  - `municipality`
  - `lot_number`
- **Pipeline:** PDF buffer → text → structured fields → confidence score (0–1).

**Run:** `cd services/document-ai && npm install && npm run dev` (default port 4005).

**Endpoint:** `POST /analyze` — multipart form with `file` (PDF). Returns extracted fields and `confidence_score`.

---

## 2. Database Tables (web-app Prisma)

### document_extractions
- `id`, `document_id` (FK property_documents), `cadastre_number`, `owner_name`, `property_address`, `municipality`, `lot_number`, `confidence_score`, `extracted_at`, `raw_text_snippet`.

### verification_matches
- `id`, `listing_id`, `document_extraction_id`, `cadastre_match`, `address_match`, `owner_match` (match | partial_match | mismatch), `overall_status`, `verification_score` (0–100), `checked_at`.

### verification_fraud_alerts
- `id`, `listing_id`, `alert_type` (duplicate_cadastre | owner_mismatch | address_mismatch | low_confidence), `message`, `severity`, `metadata`, `created_at`.

---

## 3. Automatic Matching and Score

- **Rules:** Cadastre and address compared to listing; owner compared to identity (listing host name).
- **Status:** `match` | `partial_match` | `mismatch`.
- **Scoring:** Cadastre 40, owner 40, address 20 (total 0–100). Stored in `verification_matches.verification_score`.

---

## 4. API Endpoints (web-app)

- **POST /api/document-ai/analyze**  
  - JSON: `{ document_id }` to re-run extraction for an existing document.  
  - Or multipart: `file`, `listing_id` to upload and analyze in one step.  
  - Runs extraction, saves to `document_extractions`, runs matching and fraud checks. Returns extraction + `verification_score` + `overall_status`. Does **not** approve the listing.

- **GET /api/document-ai/results/:documentId**  
  - Returns: listing data, extraction (cadastre, owner, address, confidence), verification match and score. Requires auth; only uploader (or admin) can access.

---

## 5. Admin Review Interface

At **/admin/verifications** for each pending listing admins see:

- Uploaded land register document (link to PDF).
- **Extracted:** cadastre number, owner name, address, confidence.
- **Listing data:** cadastre, address, host name.
- **AI verification score** (0–100) and overall status (match / partial_match / mismatch).
- **Fraud alerts** (e.g. duplicate cadastre, owner mismatch, address mismatch, low confidence).

**Actions:** Approve listing, Reject listing, Request more documents. **Run AI extraction** button for land register documents that have not been analyzed yet.

---

## 6. Fraud Detection Flags

Alerts are created when:

- Cadastre number appears on another active listing (`duplicate_cadastre`).
- Extracted owner name does not match listing host name (`owner_mismatch`).
- Extracted address does not match listing address (`address_mismatch`).
- Document confidence score is low (`low_confidence`).

Stored in `verification_fraud_alerts` and shown on the admin dashboard.

---

## 7. Workflow

1. User uploads land register extract (POST /api/property-documents/upload or POST /api/document-ai/analyze with file).
2. Admin (or user) triggers **Run AI extraction** or re-analyze via POST /api/document-ai/analyze with `document_id`.
3. Service extracts text and fields; web-app stores in `document_extractions`.
4. Web-app compares with listing and identity; writes `verification_matches` and `verification_fraud_alerts`.
5. Admin sees extracted data, score, and alerts at /admin/verifications.
6. Admin approves or rejects (no automatic approval).

---

## 8. Security

- **Document storage:** Files under `public/uploads/property-documents/`; use private storage (e.g. S3) and signed URLs in production.
- **Access:** Document results only for uploader or admin; admin endpoints should enforce role.
- **Audit:** Verification decisions logged (e.g. `lib/verification/audit.ts`); extend for document review events if needed.
- **Encryption:** For encrypted file storage, configure at storage layer (e.g. S3 SSE).

---

## 9. Environment

- **DOCUMENT_AI_URL** (web-app): Base URL of the document-ai service (e.g. `http://localhost:4005`). If unset, extraction returns empty fields and score 0.
- **PORT** (document-ai service): Server port (default 4005).
