import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type BnhubHostNotificationRow = {
  id: string;
  host_user_id: string;
  type: string;
  title: string;
  message: string | null;
  booking_id: string | null;
  read_at: string | null;
  created_at: string;
};

function isMissingRelationError(message: string) {
  return message.toLowerCase().includes("relation") && message.toLowerCase().includes("does not exist");
}

export async function insertBnhubHostNotification(params: {
  hostUserId: string;
  type: string;
  title: string;
  message?: string | null;
  bookingId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; skipped: true } | { ok: false; error: string }> {
  const hostUserId = params.hostUserId.trim();
  if (!hostUserId) return { ok: false, error: "host user id required" };

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, error: "supabase not configured" };

  const { data, error } = await sb
    .from("bnhub_host_notifications")
    .insert({
      host_user_id: hostUserId,
      type: params.type.trim() || "system",
      title: params.title.trim().slice(0, 500),
      message: params.message?.trim() ? params.message.trim().slice(0, 8000) : null,
      booking_id: params.bookingId?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingRelationError(error.message)) return { ok: false, skipped: true };
    return { ok: false, error: error.message };
  }
  const id = data && typeof (data as { id?: string }).id === "string" ? (data as { id: string }).id : "";
  if (!id) return { ok: false, error: "insert returned no id" };
  return { ok: true, id };
}

export async function listBnhubHostNotifications(
  hostUserId: string,
  limit = 50
): Promise<{ ok: true; rows: BnhubHostNotificationRow[] } | { ok: false; error: string }> {
  const id = hostUserId.trim();
  if (!id) return { ok: false, error: "host user id required" };

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, error: "supabase not configured" };

  const { data, error } = await sb
    .from("bnhub_host_notifications")
    .select("id, host_user_id, type, title, message, booking_id, read_at, created_at")
    .eq("host_user_id", id)
    .order("created_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) {
    if (isMissingRelationError(error.message)) return { ok: true, rows: [] };
    return { ok: false, error: error.message };
  }
  return { ok: true, rows: (data ?? []) as BnhubHostNotificationRow[] };
}

export async function markBnhubHostNotificationRead(params: {
  hostUserId: string;
  notificationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { ok: false, error: "supabase not configured" };

  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("bnhub_host_notifications")
    .update({ read_at: nowIso })
    .eq("id", params.notificationId.trim())
    .eq("host_user_id", params.hostUserId.trim())
    .is("read_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error.message)) return { ok: true };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not found or already read" };
  return { ok: true };
}

export async function countUnreadBnhubHostNotifications(hostUserId: string): Promise<number> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return 0;
  const { count, error } = await sb
    .from("bnhub_host_notifications")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", hostUserId.trim())
    .is("read_at", null);
  if (error) return 0;
  return typeof count === "number" ? count : 0;
}
