/**
 * Stub session hook for guest mode. Re-enable real Supabase session context later.
 */
export function useAuth() {
  return {
    session: null,
    loading: false,
  };
}
