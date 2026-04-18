/**
 * Upload policy defaults — enforce in API routes **before** calling storage helpers.
 * Sensitive documents: prefer signed URLs (`getSignedUrl`), not public URLs.
 */
export const STORAGE_POLICY = {
  /** Default max object size (bytes) — tune per route. */
  maxBytesDefault: 15 * 1024 * 1024,
  listingImage: { maxBytes: 12 * 1024 * 1024, allowedMime: ["image/jpeg", "image/png", "image/webp"] as const },
  avatar: { maxBytes: 5 * 1024 * 1024, allowedMime: ["image/jpeg", "image/png", "image/webp"] as const },
  document: {
    maxBytes: 25 * 1024 * 1024,
    allowedMime: ["application/pdf", "image/jpeg", "image/png"] as const,
  },
} as const;

/** Buckets that should remain private; serve via signed URLs only. */
export const PRIVATE_BUCKET_HINTS = new Set(["documents", "contracts", "uploads-temp"]);
