# LECIPM — Broker closing script, investor outreach & GTM

Internal playbook — ready to adapt for calls, emails, and demos.

---

## 1. Broker closing script (demo → paid in one call)

**Goal:** Turn demo → paying user in **one call**.

### Structure

#### Step 1 — Hook (~30 sec)

> “Most listings lose serious buyers before they even call you — not because of price, but because of **missing trust**.”

#### Step 2 — Show *their* listing (critical)

> “Let’s check **one of your listings**.”

Show:

- Trust score  
- Missing items  
- Weak points  

#### Step 3 — Pain

> “This is exactly where buyers hesitate and drop.”

#### Step 4 — Solution

> “If we fix this, your listing becomes **more credible immediately**.”

#### Step 5 — Value

> “Verified listings get **more serious buyers** and **fewer time-wasters**.”

#### Step 6 — Close

> “Do you want to use this for **all your listings**?”

Then:

- Offer a **trial**, or  
- **Discounted first month**  

#### Short close line

> “Let’s try it on your **next listing** — you’ll see the difference immediately.”

---

## 2. Investor outreach email (send this)

**Subject:** Building the trust layer for real estate  

**Message:**

> Hi [Name],  
>  
> I’m building **LECIPM** — an AI platform that **verifies listings**, **analyzes deals**, and **guides decisions** before transactions happen.  
>  
> Today, most real estate decisions are made on **incomplete or unreliable data**. We’re solving that with a **TrustGraph + Deal Analyzer** system.  
>  
> We’re starting with **brokers and investors**, and early results show strong engagement around **listing verification** and **opportunity scoring**.  
>  
> I’d love to show you a **quick demo** — I think you’ll see the potential immediately.  
>  
> Best,  
> [Your Name]  

---

## 3. Demo walkthrough (what to say) — 5–7 min

### 1. Start (problem)

> “Real estate decisions today are made on **incomplete information**.”

### 2. Show listing

Pick **one concrete example**.

> “This looks fine… but let’s **analyze it**.”

### 3. TrustGraph

Show:

- Trust score  
- Missing items  

> “These are **hidden issues** that affect buyers.”

### 4. Deal Analyzer

Show:

- Investment score  
- Risk  
- Recommendation  

> “Now we know if it’s **actually** a good opportunity.”

### 5. Copilot

Ask live:

> “Why is this listing weak?”

Show the **structured response** (no invented numbers — platform outputs only).

### 6. Close

> “This turns real estate into a **data-driven decision** process.”

---

## 4. Tailwind UI blocks (copy-paste)

Use with existing LECIPM dark theme (`#0B0B0B`, `#C9A646`, etc.). Prefer **live data** from TrustGraph / Deal Analyzer in product; these are layout references.

### Trust score card

```tsx
<div className="rounded-2xl bg-[#121212] p-6 shadow-lg">
  <h3 className="mb-4 text-lg font-semibold text-white">Trust Score</h3>
  <div className="text-4xl font-bold text-[#C9A646]">82</div>
  <div className="mt-2 text-sm text-gray-400">High Trust</div>
</div>
```

### Missing items list

```tsx
<ul className="space-y-2">
  <li className="text-red-400">Missing exterior photo</li>
  <li className="text-yellow-400">Incomplete seller declaration</li>
</ul>
```

### Deal score card

```tsx
<div className="rounded-2xl bg-[#121212] p-6">
  <h3 className="text-white">Investment Score</h3>
  <div className="text-3xl font-bold text-green-400">78</div>
  <p className="mt-2 text-sm text-gray-400">Worth Reviewing</p>
</div>
```

### Copilot panel (floating shell — product uses `CopilotFloatingDock`)

```tsx
<div className="fixed bottom-4 right-4 w-80 rounded-xl bg-black p-4 shadow-xl">
  <input
    placeholder="Ask Copilot..."
    className="w-full rounded bg-[#1a1a1a] p-2 text-white"
  />
</div>
```

---

## 5. How to reach 1,000 users fast

**Strategy = direct + value**

| Step | Action | Offer / tactic |
|------|--------|----------------|
| **1** | **100 brokers** — LinkedIn, email, calls | **Free listing analysis** |
| **2** | **Show value** — run *their* listing, show issues | Instant impact |
| **3** | **Close ~20%** | ~20 paying users (example) |
| **4** | **Referrals** | “Invite another broker → **1 month free**” |
| **5** | **Content** | “This listing scored **42/100** — here’s why” / “**3 mistakes** killing your listing” |
| **6** | **Scale ads** | Once proven: Meta + Google |

---

*Product copy must stay aligned with deterministic scores — no guaranteed outcomes or appraisal claims.*
