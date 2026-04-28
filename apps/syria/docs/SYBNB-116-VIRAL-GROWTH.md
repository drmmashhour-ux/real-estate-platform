# SYBNB-116 — Viral growth (traffic + organic shares)

**Goal:** Ship momentum quickly — WhatsApp-first loops, groups ops, and in-product copy aligned with **`src/lib/ai/shareMessage.ts`** (SYBNB-116).

**Production Arabic templates live in code** — ops paste `{link}` or locale-aware URLs from staging/production dashboards.

---

## 1. WhatsApp script — direct (platform invite)

Used for cold outreach, cousins-of-friends, and group intros — **not** a listing URL (home/browse/splash).

**Arabic (canonical — see `buildHadiahPlatformInviteMessage`)**

```
مرحبا 👋
في منصة جديدة للإيجارات بسوريا 🇸🇾
بتقدر تنشر إعلانك أو تلاقي سكن بسهولة

جربها هون 👇
{link}
```

Replace `{link}` with your **absolute** app URL (prefer **`/{locale}/…`** e.g. `/ar` or browse).

---

## 2. Listing share script (single listing)

Used when sharing **one published listing** — same structure as WhatsApp + copy buttons (`buildListingShareMessage`).

**Arabic**

```
🔥 إعلان جديد بسعر ممتاز!
شوف التفاصيل هون 👇
{link}
لا تضيع الفرصة
```

Optional SY-28 line after the headline when an ad code exists:  
`مرحباً، مهتم بالإعلان رقم …`

---

## 3. Group strategy (daily ops)

| Cadence | Action |
|--------|--------|
| **Daily** | Post in **3–5** relevant groups (same niche: إيجار، سكن طلاب، محافظة/مدينة). |
| **Speed** | Reply to comments **fast** — warm threads beat broadcast spam. |
| **Safety** | Respect group rules; vary wording slightly to avoid duplicate-detection fatigue. |

---

## 4. Comment hack (intent capture)

When someone asks something like: **«في شقة للإيجار؟»**

Reply with helpful breadth + one strong CTA:

```
في عدة خيارات 👇
{link}
```

Use **`/{locale}/browse`** or a filtered URL when available — avoid dumping `/buy`-only links.

---

## 5. Seller push (after posting)

Shown inline after quick-post success (**`ListingPostSuccessNudge`** + share CTAs).

**Arabic tagline (i18n `Listing.afterPostShareTagline`):**

```
شارك إعلانك مع أصدقائك لزيادة فرص البيع 👍
```

Pair with WhatsApp + copy buttons — **`hl_share`** attribution on links (`ListingShareActions`, SYBNB-112).

---

## Engineering anchors

| Piece | Where |
|-------|--------|
| Listing share body | `buildListingShareMessage` — `apps/syria/src/lib/ai/shareMessage.ts` |
| Platform invite body | `buildHadiahPlatformInviteMessage` — same file |
| Fallback WA body (no title/price) | `Listing.shareWhatsAppBody` — `messages/ar.json`, `messages/en.json` |
| Share URLs + attribution | `getListingPath`, `appendHadiahShareSource`, `ListingShareActions` |

---

## Success

- Traffic and **organic forwards** trend up week-over-week on **sessions / listing views / contact intents** (growth dashboards + **`SyriaGrowthEvent`** where wired).
- Share funnel stays healthy: WhatsApp + copy fire **`listing_shared`** with sane dedupe (SYBNB-113).

See also: **`SYBNB-114-QA-CHECKLIST.md`**, **`SYBNB-115-BUG-CHECKLIST.md`**.
