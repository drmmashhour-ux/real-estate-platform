# Storage scaling

Covers binary assets: listing media, contracts, uploads, exports—not relational rows.

---

## Production object storage

**Move from local or ephemeral disk** to **durable object storage** (S3-compatible or equivalent) for production user content.

**Why:** Horizontal scaling of app servers breaks local disk assumptions; backups and durability are vendor-managed.

**Priorities**

- **Tenant-safe key layout:** Prefix keys with `tenantId` (or a stable tenant slug + internal id) so lifecycle, listing, and access checks align with isolation rules.
- **File naming:** Prefer opaque internal IDs in object keys; store original filenames as metadata in the database for display.
- **Signed URLs:** Time-limited GET/PUT URLs for upload and download; avoid exposing raw bucket paths.
- **Preview strategy:** Generate thumbnails/previews asynchronously for heavy types; serve via CDN or separate cache headers where applicable.

---

## Lifecycle and retention

- **Non-critical drafts:** TTL or periodic cleanup for abandoned uploads (with legal/product approval).
- **Demo/test environments:** Aggressive retention and isolation from production buckets; separate prefixes or buckets to control cost.
- **Legal hold:** Some documents cannot be deleted on a fixed TTL; model status in DB before automated purge.

---

## Large file safeguards

- **Maximum size** enforced at API and, if possible, at signed PUT boundary.
- **Multipart uploads** for large objects to reduce timeout and retry pain.
- **MIME validation** where product allows; never trust client-only checks.

---

## Download and egress cost

- Signed URLs reduce app server streaming load.
- **CDN** in front of public-safe assets when traffic justifies cost.
- Monitor **egress**; optimize image sizes and caching headers.

---

## Future integration boundaries (not all required day one)

| Boundary | Role |
|----------|------|
| **Virus / malware scan** | Scan on upload or before promotion from quarantine to “trusted” (product decision). |
| **OCR / extraction** | Async pipeline producing searchable text; separate from OLTP path. |
| **Versioning** | Immutable object versions + DB pointer to current version; avoid overwriting blobs in place if audit matters. |

Document when each boundary becomes a requirement (compliance, enterprise deals), not by default.

---

## Cleanup policies

- Demo resets: delete or re-point object keys in sync with DB resets to avoid orphaned storage billing.
- User/tenant offboarding: scripted deletion or export per policy; audit trail for compliance.
