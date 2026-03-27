# Invention disclosure template

**Purpose:** Structured notes for discussion with a **licensed patent agent** (Canada or other jurisdictions). This document does **not** provide legal advice and does **not** assert that any subject matter is patentable.

---

## 1. Title (working)

Computer-implemented decision system for listing-centric real estate transaction evaluation using normalized evidence, confidence-aware scores, and constrained recommendations.

## 2. Inventors & dates

| Field | Notes |
|--------|--------|
| Inventors | _To be completed_ |
| Conception date | _To be completed_ |
| First reduction to practice | _To be completed_ |
| Confidentiality | _NDAs / access controls_ |

## 3. Problem addressed

- Buyers and operators need **consistent, explainable** signals on **trust** and **deal quality** without pretending certainty when data is incomplete.
- Fraud and duplicate signals may correlate across listings, media, and identities; escalation should be **evidence-linked**, not purely narrative.

## 4. Summary of the technical solution (high level)

- Multi-stage pipeline: ingest normalized listing evidence → compute **trust** and **deal** subscores with **confidence** → apply **fraud-linked penalties** and conflict handling → emit **scores**, **risk tier**, **explanation summary**, and **next actions** (deterministic where possible).
- **Confidence** is surfaced separately from headline scores (e.g. score paired with low/medium/high confidence).

## 5. Key components (non-limiting)

1. **Evidence normalization** — structured inputs (address, media, declaration, verification state).
2. **Scoring engines** — deterministic rules with explicit bands/thresholds (see `SCORING_FORMULAS_AND_THRESHOLDS.md`).
3. **Conflict / low-confidence behavior** — dampen aggressive recommendations when trust/deal confidence is misaligned.
4. **Fraud / graph-linked signals** — duplicate media clusters, ownership patterns; outputs include review recommendation flags.
5. **Validation tooling** — store human labels vs engine output; agreement and false-positive metrics for calibration.

## 6. Prior art & differentiation

See `PRIOR_ART_REVIEW_NOTES.md` and `DIFFERENTIATION_FROM_EXISTING_TOOLS.md`.

## 7. Figures / attachments checklist

- [ ] Architecture diagram (pipeline).
- [ ] Data-flow diagram (inputs → scores → UI).
- [ ] Example inputs/outputs (redacted).
- [ ] Version history of thresholds (internal changelog).

## 8. Next steps (legal)

- Engage a **licensed patent agent** in the relevant jurisdiction(s).
- Avoid public disclosure of unpublished implementation details before strategy is set.

---

_Disclaimer: This template is for internal engineering and agent briefing only._
