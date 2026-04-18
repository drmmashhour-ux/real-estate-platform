import { logError } from "@/lib/logger";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { SupabaseStorageBucketName } from "@/lib/supabase/buckets";

export async function uploadFile(
  bucket: SupabaseStorageBucketName,
  path: string,
  body: Blob | ArrayBuffer | File,
  options?: { contentType?: string; upsert?: boolean },
): Promise<{ path: string }> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase Storage is not configured (missing URL or service role key).");
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(bucket).upload(path, body, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });
  if (error) {
    logError("supabase storage upload failed", { bucket, path: path.slice(0, 120), message: error.message });
    throw error;
  }
  return { path: data.path };
}
