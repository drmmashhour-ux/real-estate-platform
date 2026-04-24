# LECIPM — Live demo script (6–8 minutes)

**Audience:** Investors, brokers, or product reviewers.  
**Tone:** Assistive, guided, compliant — not “legal advice.”  
**Related:** High-level pitch wording in [live-pitch-script.md](../live-pitch-script.md) (different focus: BNHub + LECIPM narrative).

---

## 0:00–0:20 — Hook

**Say:**

> Buying or selling real estate in Québec involves complex contracts and real legal risk. Today I’ll show you how LECIPM turns that into a guided, compliant, AI-assisted flow — in minutes.

---

## 0:20–1:10 — Start from a listing (familiar entry)

**Do:** Open a property (listing) page. Click **“Faire une offre (Turbo)”**.

**Say:**

> Users start where they already are — on a listing. One click launches our Turbo Draft.

**Technical note (don’t read aloud):** From buyer listing UI, Turbo links to  
`/drafts/turbo?type=PROMISE_TO_PURCHASE&listingId=<id>&kind=<listingKind>` (non-BNHub listings).

---

## 1:10–2:10 — Guided smart form (differentiator #1)

**Do:** Show the stepper: Parties → Property → Price → Financing → Warranty → Inclusions → Review. Enter minimal data (e.g. name, price). **Pause** on the Financing step.

**Say:**

> This isn’t a blank form. It’s a guided flow — like a broker walking you through. We add context and guardrails in real time.

---

## 2:10–3:00 — Risk scenario (make the problem visible)

**Do:** Toggle **“sans garantie légale”** (or equivalent high-risk warranty choice).

**UI to highlight:**

- Critical notice card  
- Plain-language explanation  

**Say:**

> Here’s a high-risk choice. The system explains consequences immediately and requires explicit acknowledgment — no hidden clauses.

---

## 3:00–3:40 — AI review + safer choices (differentiator #2)

**Do:** Click **“AI Review Draft”** (or the in-product equivalent).

**UI to highlight:**

- Risk panel (e.g. unclear warranty scope)  
- Safer choice suggestion (e.g. partial exclusion)  

**Say:**

> Our AI doesn’t replace rules — it reinforces them. It flags ambiguity and suggests safer alternatives without inventing facts.

---

## 3:40–4:20 — Trust hub (differentiator #3)

**Do:** Show **Compliance Score** (e.g. 78% → 92% after fixes). Show **badges** (e.g. representation disclosed, notices reviewed).

**Say:**

> We make compliance visible. Users see what’s missing, fix it, and move toward “Ready to Sign” — with full traceability.

---

## 4:20–5:00 — Protection mode + representation

**Do:** Keep the buyer **not represented**.

**UI to highlight:**

- Protection banner  
- **“Faire réviser par un courtier”** (or equivalent)  

**Say:**

> If the buyer isn’t represented, we disclose roles, recommend a broker, and can route the draft for review — protecting the user and the transaction.

---

## 5:00–5:30 — Payment gate (monetization)

**Do:** Click **Export / Finalize** → show checkout (e.g. **$15**).

**Say:**

> Consumers can generate contracts for a small fee. If a broker is attached, that path can be free and monetized on the broker side.

---

## 5:30–6:10 — Signature gate (compliance enforcement)

**Do:** Attempt to sign with **one acknowledgment still missing** → **blocked**. Then acknowledge → **allowed**.

**Say:**

> Nothing gets signed unless all notices are acknowledged, risks are resolved, and requirements are met. This is our compliance moat.

---

## 6:10–6:40 — Audit trail + PDF integrity

**Do:** Show timeline / audit log. Show PDF generated + hash stored (if surfaced in UI).

**Say:**

> Every step is logged. We can reconstruct the entire flow — who saw what, when. Documents are versioned and tamper-evident.

---

## 6:40–7:10 — Autopilot (optional quick peek)

**Do:** Switch to **SAFE_AUTOPILOT** (or your product’s safe autopilot surface). Show **suggested actions** — **not** executed without approval.

**Say:**

> Autopilot prepares actions but never commits legally. Users or brokers approve — always.

---

## 7:10–7:30 — Close

**Say:**

> LECIPM is the compliance layer missing in Québec real estate: guided drafting, AI-assisted correction, and enforceable transparency — from listing to signature.

---

## Demo tips (what investors notice)

- **Don’t rush:** Pause on warnings — show you prevent mistakes.  
- **Show a failure:** Blocked signature → then fix it.  
- **Language:** “assist,” “guide,” “validate” — **not** “legal advice.”

---

## Backup plan (if something breaks)

- Keep a **pre-filled draft ID** or bookmarked listing + Turbo URL.  
- Keep a **static PDF** and **audit log** screenshot.  
- If AI is slow: *“AI can take a few seconds; here’s a completed run.”*

---

## Compliance note (say once if asked)

> This is an assistive system aligned with Québec rules and OACIQ training principles. Final validation can involve a licensed professional when needed.

---

## Presenter quick reference (routes)

| Step | Typical path |
|------|----------------|
| Turbo draft (standalone) | `/drafts/turbo` (+ query params from listing) |
| Turbo APIs (engineering) | `/api/turbo-draft/build`, `validate`, `acknowledge`, `export`, etc. |

Use **demo/staging** data only; align on-screen copy with your current build before recording.
