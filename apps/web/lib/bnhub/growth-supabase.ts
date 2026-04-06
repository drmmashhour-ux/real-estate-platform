/**
 * Supabase inserts for BNHub growth tables (feedback, events, host leads).
 * Uses same service client as guest bookings — tables must exist (see docs/bnhub/supabase-growth-tables.sql).
 */

import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

export type BnhubFeedbackRow = {
  message: string;
  email: string | null;
  screen: string | null;
  booking_id: string | null;
};

export type BnhubEventRow = {
  event_name: string;
  metadata: Record<string, unknown> | null;
};

export type BnhubHostLeadRow = {
  name: string;
  email: string;
  property_type: string | null;
  location: string | null;
};

function isMissingTableError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("relation") && m.includes("does not exist");
}

export async function insertBnhubFeedback(
  row: BnhubFeedbackRow
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, error: "Service unavailable.", status: 503 };
  }
  const { error } = await sb.from("bnhub_feedback").insert(row);
  if (error) {
    if (isMissingTableError(error.message)) {
      return { ok: false, error: "Feedback storage is not configured.", status: 503 };
    }
    return { ok: false, error: error.message, status: 502 };
  }
  return { ok: true };
}

export async function insertBnhubEvent(
  row: BnhubEventRow
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, error: "Service unavailable.", status: 503 };
  }
  const { error } = await sb.from("bnhub_events").insert({
    event_name: row.event_name,
    metadata: row.metadata ?? null,
  });
  if (error) {
    if (isMissingTableError(error.message)) {
      return { ok: false, error: "Events storage is not configured.", status: 503 };
    }
    return { ok: false, error: error.message, status: 502 };
  }
  return { ok: true };
}

export async function insertBnhubHostLead(
  row: BnhubHostLeadRow
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, error: "Service unavailable.", status: 503 };
  }
  const { error } = await sb.from("bnhub_host_leads").insert(row);
  if (error) {
    if (isMissingTableError(error.message)) {
      return { ok: false, error: "Host leads storage is not configured.", status: 503 };
    }
    return { ok: false, error: error.message, status: 502 };
  }
  return { ok: true };
}
