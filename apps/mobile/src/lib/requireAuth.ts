/** Guest mode: no-op. Restore Supabase session check when auth returns. */
export async function requireAuth() {
  return true;
}
