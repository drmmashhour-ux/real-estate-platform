import { logError } from "@/lib/logger";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { SupabaseStorageBucketName } from "@/lib/supabase/buckets";

/** Only for buckets configured **public** in Supabase. */
export function getPublicUrl(bucket: SupabaseStorageBucketName, path: string): string | null {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = getSupabaseAdmin();
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch (e) {
    logError("supabase getPublicUrl failed", e);
    return null;
  }
}
