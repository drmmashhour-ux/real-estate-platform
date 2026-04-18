import { logError } from "@/lib/logger";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { SupabaseStorageBucketName } from "@/lib/supabase/buckets";

export async function deleteFile(bucket: SupabaseStorageBucketName, paths: string[]): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase Storage is not configured.");
  }
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(bucket).remove(paths);
  if (error) {
    logError("supabase storage delete failed", { bucket, message: error.message });
    throw error;
  }
}
