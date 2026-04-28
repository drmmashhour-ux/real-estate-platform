import { NextResponse } from "next/server";
import type { LiteBookingRow } from "@/lib/lite/lite-queries";
import { fetchLiteBookingRows } from "@/lib/lite/lite-queries";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const localeRaw = url.searchParams.get("locale")?.trim().slice(0, 8);
    const locale = localeRaw && (localeRaw === "ar" || localeRaw === "en") ? localeRaw : "ar";

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: true, authenticated: false, items: [] as LiteBookingRow[] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const items = await fetchLiteBookingRows(locale, user.id);
    return NextResponse.json({ ok: true, authenticated: true, items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[api/lite/bookings]", e);
    return NextResponse.json({ ok: false, items: [], error: "server" }, { status: 500 });
  }
}
