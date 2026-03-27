# BNHub + LECIPM — premium investor deck (PowerPoint)

## Output

| File | Description |
|------|-------------|
| **`BNHub_Pitch_Deck_Premium.pptx`** | Generated **16-slide** deck: **#0B0B0B** background, **#D4AF37** gold accent, **#FFFFFF** / **#BFBFBF** text |
| `BNHub_Pitch_Deck.pptx` | Optional **source** deck — if present, a **timestamped copy** is saved under `archive/` before each rebuild (content is **not** auto-merged; the premium file is **built from the script**) |
| `screenshots/*.png` | Product captures — see [screenshots/README.md](screenshots/README.md) |

**Visual system:** [../design-system.md](../design-system.md)

## Merge from `BNHub_Pitch_Deck.pptx`

By default, the builder **first** creates the premium **layout shell**, then **replaces each slide’s shapes** with a **verbatim copy** from `BNHub_Pitch_Deck.pptx` (same positions, **images**, **tables**, text boxes). Slide background is reset to **#0B0B0B** after each merge.

**Index map (16-slide premium vs 17-slide source):** slides **0–13** map 1:1. Premium slide **14** (“The opportunity”) ← source slide **15** (skips standalone “Vision” at source **14**). Premium slide **15** (Ask) ← source **16**.

- **Disable merge** (template only, e.g. to force script-generated diagrams):  
  `PITCH_MERGE=0 python3 scripts/build_bnhub_premium_pitch_deck.py`
- **Custom map:** edit `MERGE_TARGET_TO_SOURCE` in `scripts/build_bnhub_premium_pitch_deck.py` (dict: premium index → source index, 0-based).

## Build (from repo root)

```bash
python3 -m pip install -r docs/presentations/requirements.txt
python3 scripts/build_bnhub_premium_pitch_deck.py
```

Or from `docs/presentations` after activating a venv:

```bash
cd docs/presentations
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../.. && python3 scripts/build_bnhub_premium_pitch_deck.py
```

## Slide order (premium deck)

1. **Title** — BNHub + LECIPM, tagline, founder placeholder, logo note  
2. **Problem** — fragmentation (≤4 bullets) + right-side diagram  
3. **Solution** — unified platform + LECIPM ↔ BNHub  
4. **Product** — **4 screenshots** (homepage, listing, map/search, dashboard) in **gold-framed** panels  
5. **How it works** — List → Discover & book → Manage (numbered + icons)  
6. **Market** — big numbers + simple bar strip (replace with your sourced data)  
7. **Business model** — commissions, premium, featured  
8. **Traction** — early validation + placeholders for real metrics  
9. **Go-to-market** — Montreal, direct onboarding, content, referrals  
10. **Competition** — **table**: typical OTA vs BNHub + LECIPM  
11. **Technology** — stack / web-first / AI honesty  
12. **Growth** — playbook, B2B, cut losers  
13. **Financials** — **flow**: Users → Bookings → Commission (+ estimates disclaimer)  
14. **Team** — broker founder + hires  
15. **The Opportunity** — large vision statement (minimal)  
16. **The ask** — raise, use of funds, contact  

## After export

1. Open in **PowerPoint** or **Google Slides** (import).  
2. Apply **Fade** transition to **all** slides (python-pptx cannot set transitions).  
3. Replace `[brackets]` and **TAM/SAM** figures with **defensible** numbers.  
4. Swap **placeholder PNGs** in `screenshots/` for **real** product captures when ready.

## Design quality level

- **Investor-grade** structure: problem → solution → product → market → model → traction → GTM → competition → tech → growth → financials → team → vision → ask.  
- **Luxury restraint**: minimal bullets, **left text / right visual** on narrative slides, **dark + gold** only.  
- **Credibility**: product slide uses **real file embeds** from `screenshots/` (or generated placeholders until you replace them).

## Improvement summary (vs unstructured deck)

| Area | Change |
|------|--------|
| Visual system | Locked **black / gold / gray** tokens aligned with BNHub |
| Hierarchy | Large **white** titles, **muted** body, **gold** for emphasis & frames |
| Density | **≤4 bullets** per slide; no paragraph walls |
| Product | **Four** UI panels in **mockup-style** frames |
| Story | Added **How it works**, **competition table**, **revenue flow**, **The Opportunity** |
| Motion | **Fade only** (apply manually) |
