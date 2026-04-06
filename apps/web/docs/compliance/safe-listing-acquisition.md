# Safe listing acquisition (supply engine)

Internal reference for operators, product, and engineering. **This platform does not scrape or copy third-party listings.**

## What is allowed

- **Owner-submitted** listings and photos (the person who may sell or rent the property).
- **Broker-submitted** listings with broker authorization on file.
- **Host-submitted** BNHub stays with host-owned or permitted media.
- **Manually rewritten** summaries and descriptions written by your team or the rights-holder — not pasted wholesale from other sites.
- **Generic placeholders** for demos/tests only, clearly not real inventory in production.

## What is not allowed

1. **Never** auto-copy copyrighted photos from other platforms or listing portals.
2. **Never** auto-copy full third-party listing descriptions into production fields.
3. **Never** imply you have rights to a listing without documented permission from the owner, agent, or host.
4. **Never** run uncontrolled imports that pull text or images from competitor sites.

## If the lead came from outside the platform

Require all of the following before publication:

1. **Contact permission confirmation** (recorded date + who confirmed).
2. **Internal source note** (how you met them — not a URL dump of someone else’s listing).
3. **Rewritten description** (normalized; not a verbatim copy).
4. **Owned, uploaded, or explicitly permitted images only** — with `imagesApproved` and optional `imageSourceNote` in admin review.

## Operator checklist (before publish)

- [ ] Permission status is **granted** (or equivalent documented consent).
- [ ] `permissionConfirmedAt` / internal note is set where applicable.
- [ ] Description is **rewritten** and factual; `rewrittenDescriptionReviewed` checked.
- [ ] Images are **submitted by the rights-holder** or approved for reuse; `imagesApproved` set.
- [ ] Core fields complete: price, location, beds/baths (or stay equivalents), contact.
- [ ] Category and monetization path correct: FSBO vs broker CRM vs BNHub stay.
- [ ] Listing is in **draft** or **pending review** until this checklist passes — then approve/publish deliberately.

## Product surfaces

- Public intake: **`/list-your-property`** — requires the permission confirmation checkbox.
- Internal pipeline: **`/admin/acquisition`** — CRM-style stages and conversion to drafts.
- Compliance helpers: `normalizeListingDescription()` in code; review UI on acquisition detail.

For outreach copy, see **`docs/growth/listing-acquisition-templates.md`**.
