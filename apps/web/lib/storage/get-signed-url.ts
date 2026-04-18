import { logError } from "@/lib/logger";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { SupabaseStorageBucketName } from "@/lib/supabase/buckets";

/** Short-lived signed URL for **private** buckets (contracts, documents). */
export async function getSignedUrl(
  bucket: SupabaseStorageBucketName,
  path: string,
  expiresInSec = 3600,
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresInSec);
    if (error) {
      logError("supabase createSignedUrl failed", { bucket, message: error.message });
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (e) {
    logError("supabase getSignedUrl failed", e);
    return null;
  }
}
