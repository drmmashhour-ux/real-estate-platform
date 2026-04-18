# Review notes for counsel — redline-ready index

**Status:** **DRAFT** working document for **external lawyer review**.  
**Not legal advice.** Does **not** assert that any draft is sufficient, complete, or publishable.

**Source files (do not edit in this document — review the underlying `.md` drafts):**

| Document | File |
|----------|------|
| Terms of Service | [`TERMS-OF-SERVICE-DRAFT.md`](./TERMS-OF-SERVICE-DRAFT.md) |
| Privacy Policy | [`PRIVACY-POLICY-DRAFT.md`](./PRIVACY-POLICY-DRAFT.md) |
| Acceptable Use Policy | [`ACCEPTABLE-USE-POLICY-DRAFT.md`](./ACCEPTABLE-USE-POLICY-DRAFT.md) |
| Mutual NDA | [`NDA-MUTUAL-DRAFT.md`](./NDA-MUTUAL-DRAFT.md) |
| Contractor NDA + IP assignment | [`NDA-CONTRACTOR-IP-ASSIGNMENT-DRAFT.md`](./NDA-CONTRACTOR-IP-ASSIGNMENT-DRAFT.md) |

---

## 1. TERMS OF SERVICE (`TERMS-OF-SERVICE-DRAFT.md`)

### Sections that **need** review (priority)

| Section | Issue |
|---------|--------|
| §3 Permitted use | `[DESCRIBE INTENDED USE]` is a **placeholder** — must match actual product modules (listings, leads, bookings, BNHub, FSBO, etc.). |
| §8 Disclaimers | Explicit **placeholder** for Québec consumer protections — U.S.-style “AS IS” may be **insufficient or inappropriate** without localization. |
| §9 Limitation of liability | **Placeholder** — Civil Code / consumer law may **limit** enforceability of caps; needs Québec-specific drafting. |
| §11 Governing law and venue | **Placeholder** — must reconcile with **mandatory** rules for certain consumers and employment. |
| §12 Changes | **Placeholder** notice method — Québec may require specific fairness for amendments. |

### Placeholders / brackets

- `[OPERATOR_LEGAL_NAME]`, `[PLATFORM_NAME]`, `[EFFECTIVE_DATE]`, `[CONTACT_EMAIL]`, `[CONTACT_ADDRESS]` throughout.

### Questions for lawyer (examples — add yours)

- Is the **limitation of liability** framework appropriate for a **lead marketplace** and optional **pay-per-lead** monetization?  
- Do we need **escrow disclaimers**, **brokerage** disclaimers, or **agency** clarifications for any user segment?  
- Are **prohibited use** clauses (scraping, competitive copying) enforceable and consistent with **competition** and **interoperability** norms in Canada?  
- Should **dispute resolution** (court vs arbitration) be specified, and are **class action** waivers permissible for our user base?

---

## 2. PRIVACY POLICY (`PRIVACY-POLICY-DRAFT.md`)

### Sections that **need** review

| Section | Issue |
|---------|--------|
| §2 Scope | Domains, apps, and **allocation** of responsibility vs Stripe and other processors — **finalize**. |
| §3 Categories | **Illustrative** table — must match **data inventory / RoPA**. |
| §5 Legal bases | States that Law 25 uses **specific concepts** — draft explicitly says not to rely on it alone. |
| §7 Service providers | **Placeholder subprocessor table** — required for transparency and vendor DPAs. |
| §8 Cross-border | **Placeholder** — transfers outside Québec/Canada need **mechanism** per counsel. |
| §9 Retention | **Placeholder** schedule — legal hold and litigation may affect deletion. |
| §11 Rights | **Placeholder** process and SLA — must match **Law 25** and operational capacity. |
| §13 AI | **Placeholder** for profiling / automated decisions — map actual AI features and **meaningful** human oversight if required. |

### Questions for lawyer

- What must be disclosed for **AI** features that score, rank, or recommend listings or leads?  
- Is **consent** wording correct for **marketing** and **non-essential** cookies as implemented in the app?  
- What **French-language** obligations apply to this policy for Québec users (see `JURISDICTION-CHECKLIST.md`)?

---

## 3. ACCEPTABLE USE POLICY (`ACCEPTABLE-USE-POLICY-DRAFT.md`)

### Sections that **need** review

| Section | Issue |
|---------|--------|
| §2 Prohibited conduct | Broad categories — align **enforcement** practice and **notice** before termination where required. |
| §3 Monitoring and enforcement | **Placeholder** — describe **limited** monitoring; avoid implying full content review if untrue. |
| §4 Reporting | `[ABUSE_EMAIL]` and **triage** — operational. |

### Questions for lawyer

- Does the AUP **overlap** cleanly with ToS §4, or should provisions be **merged** to reduce conflict?  
- Are **API** and **scraping** rules clear enough for **good-faith** integrations vs abuse?

---

## 4. NDA — MUTUAL (`NDA-MUTUAL-DRAFT.md`)

### Sections that **need** review

| Section | Issue |
|---------|--------|
| §1 Purpose | `[DESCRIBE PURPOSE / PROJECT]` — fill per deal. |
| §2 Confidential Information | Exclusions — **counsel** to finalize under Québec law. |
| §4 Required disclosure | **Placeholder** for compelled disclosure process. |
| Term / residuals | Read full draft — **term**, **return of materials**, **no partnership** clauses. |

### Questions for lawyer

- Is **mutual** form appropriate for **investors**, **partners**, and **vendors** alike, or do we need **one-way** variants?  
- Are **standard** exceptions (public domain, prior knowledge) complete?

---

## 5. NDA — CONTRACTOR + IP (`NDA-CONTRACTOR-IP-ASSIGNMENT-DRAFT.md`)

### Sections that **need** review

| Section | Issue |
|---------|--------|
| §3 Ownership / assignment | **Moral rights** in Canada/Québec — draft flags **assignability** — **must** be finalized. |
| §4 Pre-existing materials | **Schedule A** — IP hygiene. |
| §6 Non-solicitation / non-compete | May be **restricted** or **unenforceable** in part — **employment counsel** required. |

### Questions for lawyer

- Is **contractor** classification defensible for intended roles (tax + employment)?  
- Is **IP assignment** effective for **software**, **prompts**, and **datasets** produced for the platform?

---

## Cross-cutting questions (lead marketplace)

- Do we need explicit **lead quality disclaimers** and **refund** rules in ToS (not just marketing)?  
- **Québec-specific** language requirements for **public-facing** terms and privacy notices — see `JURISDICTION-CHECKLIST.md`.  
- Do **pay-per-lead** fees trigger **consumer protection** or **payment services** issues — **confirm** with counsel.

---

**Use:** Hand this file to counsel **with** the five draft `.md` files and `LAWYER-HANDOFF-PACK.md`.
