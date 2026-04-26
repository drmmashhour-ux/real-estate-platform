import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";

const BodyZ = z.object({
  locale: z.enum(["en", "fr", "ar"] as [LocaleCode, LocaleCode, LocaleCode]),
});

/** PATCH /api/me/ui-locale — persist preferred UI language for the signed-in user. */
export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await request.json().catch(() => null);
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const { locale } = parsed.data;
  await prisma.user.update({
    where: { id: userId },
    data: { preferredUiLocale: locale },
  });
  const maxAge = 60 * 60 * 24 * 365;
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}

/** GET /api/me/ui-locale — current preference (cookie wins if sent). */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ locale: null as LocaleCode | null });
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredUiLocale: true },
  });
  const pref = u?.preferredUiLocale?.trim();
  const hit = UI_LOCALE_ENTRIES.find((l) => l.code === (pref as LocaleCode));
  return NextResponse.json({ locale: hit?.code ?? null });
}
