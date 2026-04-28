# SYBNB-115 — Bug / regression checklist (Hadiah Link / `apps/syria`)

**Goal:** Surface **real-world failures** before scale — edge cases, abuse paths, broken integrations.

Use **staging** + **staging DB**. Record environment (commit, locale tested).

---

## 1. Image upload

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Large files → 413** | Upload single image **> 2 MiB** raw to `/api/listings/upload-image` or batch `/api/listings/images` | **`413`** + `file_too_large` (limits in `photo-upload.ts` → `MAX_IMAGE_FILE_BYTES`) |
| **Huge JSON body → 413** | Quick-create payload exceeding **`MAX_LISTING_CREATE_PAYLOAD_BYTES`** (~2 MiB) | **`413`** + `payload_too_large` from `/api/listings/create` |
| **Slow / flaky network** | Throttle to Slow 3G; upload 5 images batch | Progress/error UX OK; no silent stall; partial failure shouldn’t corrupt listing draft unexpectedly |

**Code anchors:** `src/lib/syria/photo-upload.ts`, `src/app/api/listings/images/route.ts`, `src/app/api/listings/create/route.ts`.

---

## 2. Phone reveal

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Multiple rapid clicks** | Tap **عرض رقم الهاتف** repeatedly | SYBNB-97 reveal cooldown / antispam still sane **UI**; no duplicate catastrophic reveals |
| **Tracking / dedupe** | Same IP taps WhatsApp / phone several times same UTC day | **SYBNB-113:** second tap **does not** bump DB counters or spam **`contact_click`** (dedupe via `syria_listing_contact_dedupe`) |
| **Growth signals** | One intentional reveal | **`POST /api/sybnb/events`** `phone_reveal` fires + **`SyriaGrowthEvent` `phone_reveal`** where wired |

**Code anchors:** `ListingTrustPanel`, `/api/sybnb/events`, `src/lib/lead-increment.ts`, `src/lib/syria/share-abuse.ts`.

---

## 3. Anonymous posting & spam

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Bypass IP caps** | From **same IP**, spam anonymous quick-posts past daily slot | **`429`** + `rate_limit_anon` from `/api/listings/create` (`consumeAnonymousListingIpSlot`) |
| **High-value without login** | Market/category resolving to **`isHighValuePostingKind`** | **`401`** + `auth_required` — anonymous cannot publish |
| **Missing phone** | Omit phone / whitespace-only phone | **`400`** + `validation` (route requires `phone.trim()`) |
| **Low-value tier abuse** | Many junk listings within caps | Ops/analytics spot spam patterns — caps are **not** full antifraud |

**Code anchors:** `src/app/api/listings/create/route.ts`, `src/lib/syria/anonymous-listing-ip-limit.ts`, `src/lib/listing-posting-kind.ts`.

---

## 4. Trust system (badges)

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Verified badge wrong** | Sellers flagged vs verified; toggle staging DB flags | **موثوق** / badges align with **`listingTrustedSignals`** (`listing-trust-badges.ts`, listing detail page) |
| **Trusted listing vs SYRIA_MVP** | Toggle **`SYRIA_MVP`** / prod-like env | When **`SYRIA_MVP`**, trusted listing badge bundle behaves per **`syriaFlags`** — no phantom badges |

**Code anchors:** `src/lib/listing-trust-badges.ts`, `src/app/[locale]/listing/[id]/page.tsx`.

---

## 5. Share links

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Wrong host/path** | Share + paste copied URL | Must resolve **`/{locale}/listing/{id}`** (see `getListingPath`), not `/buy`-only |
| **Missing locale** | Arabic locale session vs EN | Links preserve **`/[locale]/`** segment users expect |
| **Attribution** | Inspect WhatsApp message vs copied URL | **`hl_share=whatsapp`** vs **`hl_share=copy_link`** (Hadiah share attribution) |

**Code anchors:** `src/lib/syria/listing-share.ts`, `src/lib/syria/hadiah-share-attribution.ts`, `ListingShareActions`.

---

## 6. Cloudinary

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Broken images** | Mixed CDN-off vs on staging | **`CLOUDINARY_*`** unset → explicit failures / fallback messaging — never silent purple blanks everywhere |
| **Wrong transformation** | Inspect **`Image`** `src` on listing gallery | Delivery URL uses **`w_800`**, **`c_limit`**, **`q_auto`**, **`f_auto`** per **`cloudinary-server.ts`** (`DELIVERY_TRANSFORMATION`) |
| **Wrong folder / isolation** | Upload listing asset | Assets under **`CLOUDINARY_LISTINGS_FOLDER`** default **`sybnb/syria`** — **never** legacy Canada folder **`sybnb/listings`** on Syria prod (`app-isolation` guard) |

**Code anchors:** `src/lib/syria/cloudinary-server.ts`, `src/lib/env/app-isolation.ts`, `next.config.ts` `images.remotePatterns`.

---

## 7. Auth & phone verification

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **High-value posting without login** | Anonymous POST high-value kind | **`401`** `auth_required` (see §3) |
| **Phone not verified but privileged UX** | User without **`phoneVerifiedAt`** / verification gates where required | Product-specific gates respected — grep **`phoneVerified`**, **`verifiedAt`** in flows under test |

**Note:** Exact verification matrix depends on feature flags — smoke-test logged flows separately.

---

## 8. Performance

| Bug vector | How to reproduce | Expected / verify |
|------------|------------------|-------------------|
| **Heavy JS bundle / HTML** | Open listing detail / browse → Chrome DevTools **Coverage + Performance** | No catastrophic layout freeze; investigate bundles **`> ~1 MiB`** transfer if repeatable |
| **Too many network requests** | Filter waterfall — duplicate **`listing_view`** / **`analytics`** / prefetch storms | Reasonable request count per navigation (single SSR round-trip baseline); **`listing_view`** not multiplied unnecessarily |

**Code anchors:** `src/lib/syria/sybn104-performance.ts` (browse caching hints); SYBNB-113/SYBNB-112 analytics routes — verify repeat-fire guardrails where implemented.

---

## Success criteria

- ☐ No **sev-1** regressions on paths above (crash / data loss / payment bypass / auth bypass).  
- ☐ Critical integrations (**Cloudinary**, **analytics**, **lead dedupe**) behave under abuse + weak network.  
- ☐ Launch readiness: merge results with **`SYBNB-114-QA-CHECKLIST.md`**.
