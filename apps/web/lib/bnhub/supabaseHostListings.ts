import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

/** Count of BNHub `listings` rows where `host_user_id` matches the Supabase auth user id. */
export async function getBnhubHostListingCountForUser(supabaseUserId: string): Promise<number> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb || !supabaseUserId.trim()) return 0;
  const { count, error } = await sb
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", supabaseUserId.trim());
  if (error) return 0;
  return count ?? 0;
}
