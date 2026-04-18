/** Browser client: import from `@/lib/supabase/client` (client-only entry). */
export { createSupabaseServerClient } from "./server";
export { getSupabaseAdmin, isSupabaseAdminConfigured } from "./admin";
export { SUPABASE_STORAGE_BUCKETS, type SupabaseStorageBucketName } from "./buckets";
