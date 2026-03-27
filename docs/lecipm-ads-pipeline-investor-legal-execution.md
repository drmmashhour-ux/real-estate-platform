# LECIPM — Ad creatives, CRM, investor script, legal (Canada/Quebec), execution

Companion to the pixel landing and product docs.

**SQL (Supabase / Postgres):** [`docs/sql/supabase-crm-pipeline.sql`](sql/supabase-crm-pipeline.sql) — same tables as Prisma `CrmSalesLead` / `CrmSalesActivity` (`crm_leads`, `crm_activities`).

---

## 1. Ad creatives (ready to use)

### Ad idea 1 — before / after listing

**Visual:** split: low score / messy listing vs. fixed listing / higher score.

**Copy:**

- This listing scored 42/100  
- Here’s why buyers ignored it  

### Ad idea 2 — trust score

**Visual:** large score badge or meter.

**Copy:**

- Check your listing score before buyers do  

### Video script (short)

| Phase | Line / beat |
|--------|----------------|
| **Hook** | “Your property might not be selling for THIS reason…” |
| **Middle** | Show issues → show fix |
| **End** | “Analyze your listing now” |

### Video ad 1 (alternate)

| Phase | Content |
|--------|---------|
| **Hook (0–3s)** | “This is why your property is not selling” |
| **Middle** | Bad listing → low score → fixed listing → high score |
| **End** | “Check your listing score now” |

### Static ad (generic)

**Text:**

- Your listing might be losing buyers  
- Check your trust score  

**Targets:** brokers · sellers · investors  

---

## 2. Sales pipeline (simple CRM)

**Stages:** `lead` · `contacted` · `demo_booked` · `demo_done` · `trial` · `paid`  

**Tool:** Notion **or** Supabase — run [`docs/sql/supabase-crm-pipeline.sql`](sql/supabase-crm-pipeline.sql) (or apply the app Prisma migration so the same tables exist in your main database).

**Fields:** name · company · email · stage · source · notes · last contact · created time  

**Goal:** Move fast — **Lead → Demo → Paid**  

---

## 3. Investor meeting script

| Block | Talk track |
|--------|------------|
| **Start (30s)** | “Real estate is still operating on unverified information.” |
| **Problem** | “Buyers don’t trust listings, and decisions are slow.” |
| **Solution** | “We built LECIPM — an AI system that verifies, analyzes, and guides decisions.” |
| **Demo** | Trust score · Deal score · Copilot |
| **Vision** | “We are building the operating system of real estate transactions.” |
| **Close** | “We’re now looking to scale distribution and grow adoption.” |

---

## 4. Legal + company setup (Canada / Quebec)

**Structure:** Corporation (Inc.)

**Typical steps**

1. Register company (Quebec or federal)  
2. Obtain **NEQ** (Quebec)  
3. **Business number** (CRA)  
4. Open **business bank account**  
5. Register for **GST / QST** when required  

**Documents**

- Terms of Service  
- Privacy Policy  
- **Disclaimer:** no legal advice; no financial advice  

**Platform copy:** *“Platform provides insights, not professional advice.”*

---

## 5. Investor data room (prepare)

| Area | Items |
|------|--------|
| **Product** | Demo video · screenshots · architecture overview |
| **Traction** | Users · listings · growth |
| **Business** | Pricing · revenue model · projections |
| **Tech** | System architecture · AI explanation · scalability |
| **Legal** | Incorporation docs · terms of service · privacy policy |

---

## 6. Execution plan (example)

| When | Focus |
|------|--------|
| **Today** | Deploy landing page · create demo · send 20 messages |
| **This week** | ~10 demos · 3–5 users |
| **This month** | 20–50 users · first revenue |

| When (alt. horizon) | Focus |
|------|--------|
| **Week 1** | Landing page · demo ready · outreach starts |
| **Week 2** | ~20 demos · 5–10 users |
| **Week 3–4** | Product polish · testimonials · first revenue |
| **Month 2** | Ads · scale toward 50–100 users |

---

## Final truth

Success is driven less by feature count than by **time-to-value**, **clarity**, and **distribution**.
