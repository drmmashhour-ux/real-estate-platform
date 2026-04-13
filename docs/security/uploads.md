# File and upload security

## Principles

1. **Allowlist** MIME types and extensions for user uploads (images: jpeg/png/webp/gif; documents: pdf/docx as product allows).
2. **Size limits** enforced server-side before storage (stream or multipart limits).
3. **Random object keys** in object storage — avoid guessable URLs.
4. **No executable** content: reject `application/x-msdownload`, `text/html` uploads where inappropriate.
5. **Scanning** — optional ClamAV / malware pipeline (see comments in `apps/web/.env.example`).
6. **Access** — private buckets with signed URLs for download; public CDN only for non-sensitive marketing assets.

## Code references

- Validators: `apps/web/lib/security/validators/index.ts` (`allowedImageExtensions`, `allowedDocExtensions`).
- Malware / scan env: `apps/web/.env.example` (CLAMAV_*, MALWARE_SCAN_*).

## Related

- [security-audit.md](./security-audit.md)  
