# Scoring formulas and thresholds

**Purpose:** Single place to align **documentation** with **versioned implementation**. Update this file when bands or weights change.

**Disclaimer:** Scores are **model outputs**, not appraisals, legal opinions, or guarantees. Thresholds below are **illustrative** of the product’s visual system; authoritative values live in code.

## Visual bands (UI)

| Range | Band | Typical accent |
|-------|------|----------------|
| 0–39 | Critical | Red |
| 40–64 | Caution | Amber |
| 65–84 | Strong | Green |
| 85–100 | Verified | Gold / emerald |

Confidence is **not** merged into the headline number in the UI; it is shown **alongside** (e.g. “78 / medium confidence”).

## Trust (conceptual)

- Components may include address validity, media, identity, declaration completeness, consistency.
- Raw trust and confidence are combined; **fraud penalty** reduces effective trust within capped limits.
- **Level** bands (e.g. low / medium / high / verified) align to score ranges in `trustScore.types` / UI helpers.

## Deal (conceptual)

- Deal score reflects modeled economics vs assumptions; **confidence** reflects data completeness and comparable strength.
- **Recommendation** bands (e.g. insufficient_data, caution, worth_reviewing, strong_opportunity, avoid) are **not** identical to numeric bands; they incorporate confidence and risk.

## Fraud / risk

- Fraud score aggregates signal families; **risk level** maps from fraud score.
- **Review recommended** appears when score or penalties cross configured thresholds (see `calculateFraudScore` implementation).

## Change control

1. Change code and tests.
2. Update this document with **date** and **reason**.
3. Run calibration (`model_validation_*` tables) before large weight shifts.

---

_For filing discussions, attach export of thresholds from the specific release tag._
