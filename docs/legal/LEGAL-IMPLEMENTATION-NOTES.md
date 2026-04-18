# Legal implementation notes — LECIPM platform

**Purpose:** Map **draft documentation** in `docs/legal/` to **existing app surfaces** and internal processes. **Not legal advice.**

---

## 1. Where Terms and Privacy should appear (current codebase)

The web app already exposes a **Legal center** and routes (locale-aware under `app/[locale]/[country]/legal/`):

| Topic | Typical route pattern | Implementation note |
|-------|----------------------|----------------------|
| Terms of Service | `/legal/terms` | Content from `getActiveDocument` + fallback HTML (`lib/legal/default-legal-en.ts`) |
| Privacy Policy | `/legal/privacy` | Same pattern |
| Platform usage | `/legal/platform-usage` | Additional conduct rules—**align** with Acceptable Use draft |
| Cookies | `/legal/cookies` | Cookie policy |
| Copyright | `/legal/copyright` | IP notices |
| Legal index | `/legal` | Lists major documents |

**Draft markdown** in `docs/legal/*-DRAFT.md` is **not** automatically rendered in production. To publish:

1. Have counsel approve text.  
2. Load approved HTML/content via your **existing legal document pipeline** (admin/CMS/DB as implemented), **or** update default HTML **with counsel review**.

---

## 2. Signup / leads / consent

- **Signup and forms:** Ensure checkboxes / links reference **current** Terms and Privacy URLs **as implemented** (`REQUIRED_FOR_PLATFORM` in `lib/legal/constants.ts` for gating logic—verify in auth flows).
- **Marketing emails:** Separate **consent** where required—do not copy text from drafts without counsel.

---

## 3. Admin / incidents

- **Privacy incidents:** Internal runbook (see `LAW25-PRIVACY-CHECKLIST.md`); **notify counsel** before external statements.
- **Law enforcement requests:** Single **internal** routing (legal + security)—document in ops handbook.

---

## 4. Where to store signed NDAs and contractor agreements

- **Recommended:** Contract management (e.g., DocuSign + secure storage), **not** in git.  
- **HR / people ops** index of **effective dates** and **IP assignment** presence for contributors.

---

## 5. When to involve counsel

- Before **public launch** of new data practices or **AI** features handling personal information.  
- Before **enforcing** Terms/AUP against a user or competitor.  
- Before **registering trademarks** or sending **cease-and-desist** letters.  
- After **any** suspected **breach** involving personal data.

---

## 6. Trademark timing (high level)

- **Clearance search** before heavy branding spend.  
- **Canadian** trademark application(s) for core marks when budget allows.  
- **Do not** claim ® until registered (use ™ if unregistered—counsel advice).

---

## 7. Québec / bilingual note

- Public-facing **Québec** consumers may require **French** accessibility for legal notices and certain **publicity** obligations—**Bill 96** and consumer law—**specialist counsel** required for production copy.

---

## 8. Optional future app work (not required for this package)

- Add `/legal/acceptable-use` **only after** counsel-approved content and same CMS pattern as Terms.  
- Add footer link only if consistent with i18n (`FooterClient.tsx` already links Terms/Privacy).

---

**Confirmation:** This file references **existing** routes only; it does not change application behavior.
