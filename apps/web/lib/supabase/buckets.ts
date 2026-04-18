/**
 * LECIPM Infrastructure v1 — Supabase Storage bucket names (create in Supabase Dashboard → Storage).
 * Server uploads must use {@link getSupabaseAdmin}; never expose service role to the client.
 */
export const SUPABASE_STORAGE_BUCKETS = {
  listings: "listings",
  userAvatars: "user-avatars",
  documents: "documents",
  contracts: "contracts",
  uploadsTemp: "uploads-temp",
} as const;

export type SupabaseStorageBucketName = (typeof SUPABASE_STORAGE_BUCKETS)[keyof typeof SUPABASE_STORAGE_BUCKETS];
