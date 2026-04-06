import { supabase } from "./supabase";

/** Merge optional JSON headers with `Authorization: Bearer` when a Supabase session exists. */
export async function buildAuthHeaders(
  base?: Record<string, string>
): Promise<Record<string, string>> {
  const h: Record<string, string> = { Accept: "application/json", ...base };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const tok = data.session?.access_token;
    if (tok) h.Authorization = `Bearer ${tok}`;
  }
  return h;
}
