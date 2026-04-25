# Québec broker outreach — ICP, channels, and scripts (LECIPM)

**Purpose:** Practical GTM for **Montréal / Québec first**, independent of “big agency” sales. Complements the [Broker Acquisition Engine](./broker-acquisition-engine.md) (`/admin/brokers-acquisition` when the feature flag is on). For the **First 10 Montréal/Laval** manual pipeline (file-backed, admin-only), use **`/admin/first-brokers`**.

**Positioning (trust-safe):** LECIPM is an **assistive** platform aligned with Québec practices — it **helps structure and validate** work; it is **not** a substitute for professional judgment, mandatory forms, or regulator approval. **Do not** claim “legal replacement,” “OACIQ-approved,” or “#1” without substantiation.

---

## 1. Who to target (do not start with big agencies)

| Priority | Segment | Why |
|----------|---------|-----|
| **A** | Independent (self-employed) brokers | Faster decisions, open to new tools |
| **B** | Small teams (1–5 brokers) | Lean; need efficiency |
| **C** | Newer brokers (0–3 years) | Hungry for edge, lead flow, and fewer mistakes |
| **D** | Active on **Facebook groups**, **Instagram / TikTok** | Public proof of activity; DMs work |
| **E** | **FSBO-friendly** brokers | Aligns with LECIPM’s mixed journeys |

**What they actually care about (lead with this):** more deals, less time, fewer errors — *not* “AI” or “tech” for its own sake.

---

## 2. Where to find them (real sources)

### Facebook groups (often high signal)

**Search (examples):** `Courtiers immobiliers Québec`, `Immobilier Québec`, `Investissement immobilier Québec`, `Flip immobilier Québec`.

**Look for:** brokers answering questions, posting listings, being helpful (then DM or add to pipeline).

### Instagram / TikTok

**Hashtags (examples):** `#courtierimmobilier`, `#immobilierquebec`, `#montrealrealestate`

**Tactic:** prioritize **small–mid** audiences; short DM, no walls of text.

### Google Maps (underrated)

**Search (examples):** `Courtier immobilier Montréal`, `Courtier Laval`

**Extract:** phone, site, email from the business profile; log in the acquisition table.

### LinkedIn

**Search (examples):** `Real estate broker Québec` — filter for **under five years** of experience where possible.

---

## 3. Outreach (what works)

- **No** long DMs, **no** product thesis in the first message.
- **Yes** short DM / short call / **quick** demo invite.

### DM / email — Version 1 (simple hook)

> Salut [Prénom],  
>  
> je travaille sur une plateforme au Québec qui aide les courtiers à:  
> - gagner du temps sur les formulaires  
> - réduire les erreurs  
> - générer plus de leads  
>  
> On cherche 10 courtiers pour tester gratuitement.  
>  
> Ça te prend 10 minutes de démo. Tu serais ouvert·e à voir ?  
>  
> — [Nom]

### DM / email — Version 2 (slightly stronger)

> Salut [Prénom],  
>  
> on a construit un système qui automatise une partie du travail de rédaction + validation des offres immobilières au Québec.  
>  
> Objectif: moins de temps sur les formulaires, plus de deals, moins de risques.  
>  
> On onboard 10 courtiers en early access (gratuit). Je peux te montrer en 10 min. Intéressé·e ?

---

## 4. Call script (first 30s + questions)

**Open (direct):**  
*« Je vais être direct : on a un système qui réduit le travail répétitif des courtiers — formulaires, vérifications, erreurs — et qui peut aussi alimenter des leads. »*

**Then ask and listen:**

- *« Combien de temps tu passes sur les formulaires par semaine ? »*
- *« Est-ce que tu perds parfois du temps avec des clients pas prêts ? »*

**Demo (tight):** only what lands — e.g. speed on drafts, **assistive** review, **compliance / trust** signals, lead entry. Frame everything as *time, deals, risk* — not technology labels.

**Close:**

> *« On cherche 10 courtiers pour tester gratuitement. Tu serais partant·e d’essayer sur 1–2 dossiers ? »*

---

## 5. What you offer (you are not “selling” yet)

- Free access (early cohort)
- Priority leads (when the product actually has them)
- Real influence on the roadmap
- “Founding broker” (or similar) **status** — no false regulatory claims

---

## 6. Onboarding (after “yes”)

**Do not** send login and disappear.

1. **~10 min** onboarding call.
2. Walk: **create draft → run review/assist → path to finalize** (use real product steps).
3. Give **one** concrete use case they can complete this week.

---

## 7. Track everything (lightweight)

Use a spreadsheet or the internal [Broker Acquisition Engine](./broker-acquisition-engine.md) pipeline (`/admin/brokers-acquisition`).

| Broker | Source | Contacted | Demo | Signed / pilot | Used product | Feedback |
|--------|--------|-------------|------|----------------|--------------|----------|
| … | FB / IG / Maps / LI | date | y/n | y/n | y/n | notes |

---

## 8. Bonus: high-conversion move

- **2-minute Loom:** create draft → review/assist flow → trust/compliance signal → send in DM.  
- Keep claims **factual** and **assistive** (see top of this doc).

---

## 9. Realistic targets (illustrative)

| Horizon | Suggested bar (tune to capacity) |
|---------|----------------------------------|
| Week 1 | e.g. ~30 contacted, ~10 demos, **3–5** pilot onboarded |
| Week 2 | e.g. **10–15** total pilots (if follow-through holds) |

**Founding truth:** you do not need 100 brokers — you need a **small number who actually use** the product weekly. **Five engaged brokers** can validate the loop.

---

## 10. Link to product surfaces (for demos)

- Internal scripts and pipeline: `getBrokerOutreachScriptList` / broker-outreach service (see [broker-acquisition-engine.md](./broker-acquisition-engine.md)).
- Production / compliance: `lib/production-guard` (form lock, signature gate, audit — for anything that looks like a “signed” or regulated flow).
