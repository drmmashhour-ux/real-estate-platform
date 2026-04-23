/**
 * Broker mobile uses the same session as BNHub mobile:
 * Supabase JWT when present, otherwise `bnhub_mobile_session_token` (DB session) from SecureStore.
 * @see services/apiClient.ts `mobileFetch`
 */
export function describeMobileSessionSources(): string {
  return "Authorization: Bearer from Supabase session, else SecureStore session token.";
}
