import type { SupabaseClient } from "@supabase/supabase-js";

export type WeeklyRevenueBar = {
  /** ISO date Monday of week (UTC) */
  weekStart: string;
  label: string;
  amount: number;
};

const WEEKS = 8;

function mondayUtc(iso: string): Date {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(d: Date): string {
  const m = d.toISOString().slice(5, 10);
  return m.replace("-", "/");
}

/**
 * Last N weeks (Mon–Sun UTC) gross from paid bookings by `updated_at`.
 */
export async function computeWeeklyRevenueBars(sb: SupabaseClient): Promise<WeeklyRevenueBar[]> {
  const { data: rows, error } = await sb
    .from("bookings")
    .select("total_price, updated_at")
    .eq("status", "paid");

  if (error || !rows?.length) {
    const empty: WeeklyRevenueBar[] = [];
    const now = new Date();
    const start = mondayUtc(now.toISOString());
    for (let i = WEEKS - 1; i >= 0; i--) {
      const w = new Date(start);
      w.setUTCDate(w.getUTCDate() - i * 7);
      empty.push({
        weekStart: w.toISOString().slice(0, 10),
        label: formatWeekLabel(w),
        amount: 0,
      });
    }
    return empty;
  }

  const amounts = new Map<string, number>();
  for (const r of rows as { total_price: number | string; updated_at: string | null }[]) {
    const u = r.updated_at;
    if (!u) continue;
    const wk = mondayUtc(u);
    const key = wk.toISOString().slice(0, 10);
    const price = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
    if (!Number.isFinite(price)) continue;
    amounts.set(key, Math.round(((amounts.get(key) ?? 0) + price) * 100) / 100);
  }

  const anchor = mondayUtc(new Date().toISOString());
  const out: WeeklyRevenueBar[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const w = new Date(anchor);
    w.setUTCDate(w.getUTCDate() - i * 7);
    const key = w.toISOString().slice(0, 10);
    out.push({
      weekStart: key,
      label: formatWeekLabel(w),
      amount: Math.round((amounts.get(key) ?? 0) * 100) / 100,
    });
  }
  return out;
}
