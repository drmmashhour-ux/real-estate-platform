import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdStudioStyle } from "@/lib/ad-studio";
import { routing } from "@/i18n/routing";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: listingId } = await ctx.params;
  if (!listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const raw = o.adStyle;
  const adStyle = raw === null || raw === undefined ? null : typeof raw === "string" ? raw.trim() : null;
  if (adStyle && !isAdStudioStyle(adStyle)) {
    return NextResponse.json({ ok: false, error: "invalid_ad_style" }, { status: 400 });
  }

  const row = await prisma.syriaProperty.findFirst({
    where: { id: listingId, ownerId: user.id, fraudFlag: false },
  });
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await prisma.syriaProperty.update({
    where: { id: listingId },
    data: { adStyle: adStyle || null },
  });

  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/listing/${listingId}`);
    revalidatePath(`/${loc}/studio/${listingId}`);
  }

  return NextResponse.json({ ok: true, adStyle: adStyle || null });
}
