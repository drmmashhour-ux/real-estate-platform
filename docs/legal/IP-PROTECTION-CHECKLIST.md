# IP protection — internal checklist (LECIPM)

**Purpose:** Operational hygiene to support **trade secret**, **copyright**, and **trademark** strategy. **Not legal advice.** Confirm with IP counsel.

---

## A. What different rights generally cover (simplified)

| Type | Generally protects | Does not protect |
|------|-------------------|------------------|
| **Copyright** | Original **expression** in code, text, graphics, UI compilations (as fixed works) | Ideas, **general** business methods, facts |
| **Trademark** | **Brand identifiers** (names, logos) that distinguish services in commerce | Generic terms; confusingly similar marks of others |
| **Trade secrets** | **Confidential** information with **economic value** from not being generally known, subject to **reasonable** secrecy measures | Information that is public or independently discoverable |
| **Patents** | **Novel, useful** inventions (where applicable)—**rare** for pure software business methods without specialist advice | Abstract ideas without qualifying claims |

**Reality check:** A **“general”** marketplace or brokerage model, without specific protectable expression or confidential detail, is **hard** to monopolize via IP alone.

---

## B. Technical and operational checklist

- [ ] **Server-side logic:** Keep scoring, pricing rules, proprietary algorithms, and **prompts** **off** client bundles where feasible.
- [ ] **Secrets:** Document what you treat as **trade secret** (e.g., ranking weights tuning, internal benchmarks)—**restrict** repo and production access.
- [ ] **Repositories:** Private repos for core product; **NDAs** for contractors (see templates in this folder).
- [ ] **Contributor records:** CLAs or employment/contractor **assignments** on file for core contributors.
- [ ] **Version control:** Preserve **authorship history** (helps copyright evidence; not a substitute for registration or assignments).
- [ ] **Terms / AUP:** Published **no reverse engineering / no scraping** clauses (after counsel review)—align with `docs/legal` drafts.
- [ ] **APIs:** Rate limits, authentication, ToS acceptance for API consumers.
- [ ] **Marking:** “© [YEAR] [ENTITY]” on marketing materials and app **where appropriate**—counsel on formal notice requirements.
- [ ] **Trademark:** When budget allows, **search** then **apply** for key word marks in **Canada** (and other jurisdictions as advised).
- [ ] **Don’t over-claim:** Avoid public statements that **everything** is “proprietary” if it is **standard industry practice**—weakens credibility in disputes.

---

## C. Trade secret vs public marketing

- **Trade secret:** Requires **confidentiality**. Public blog posts describing internals may **destroy** trade-secret status.
- **Marketing:** You can describe **features** without exposing **implementation** or **exact** formulas.

---

## D. Incident and evidence

- [ ] Preserve **logs** and **contracts** if misappropriation suspected—**counsel immediately**.
- [ ] **Do not** make public accusations without legal review.

---

**Review:** IP counsel + litigation counsel for enforcement strategy.
