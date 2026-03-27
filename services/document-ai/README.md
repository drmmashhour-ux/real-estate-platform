# Document AI Service

Extracts structured data from land register PDFs: cadastre number, owner name, property address, municipality, lot number.

## Structure

- `controllers/` — HTTP handlers (analyze)
- `services/` — Extraction pipeline (PDF → text → parse)
- `routes/` — Express routes
- `parsers/` — PDF text extraction and land-register regex parsing
- `models/` — Types
- `tests/` — Unit tests

## Endpoints

- **POST /analyze** — Body: multipart form with `file` (PDF). Optional: `document_id`. Returns extracted fields and confidence_score (0-1).

Results are stored in the web-app (document_extractions, verification_matches). Use the web-app **GET /api/document-ai/results/:documentId** to retrieve stored results.

## Run

```bash
npm install
npm run dev
# PORT=4005 (default)
```

## Environment

- `PORT` — Server port (default 4005)
