import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";

const dateKey = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Set short-stay **booked** dates (`YYYY-MM-DD`). Dates not in the list are considered available.
 * Body: { availability: string[] } — max 366 unique entries, ISO date parts only.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  assertDarlinkRuntimeEnv();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const raw = (body as { availability?: unknown }).availability;
  if (!Array.isArray(raw) || !raw.every((x) => typeof x === "string" && dateKey.test(x))) {
    return NextResponse.json({ ok: false, error: "invalid_availability" }, { status: 400 });
  }

  const unique = [...new Set(raw as string[])].sort().slice(0, 366);

  const existing = await prisma.syriaProperty.findFirst({
    where: {
      id,
      ownerId: user.id,
      OR: [{ type: "BNHUB" }, { category: "stay", type: "RENT" }],
    },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await prisma.syriaProperty.update({
    where: { id },
    data: { availability: unique },
  });

  return NextResponse.json({ ok: true, availability: unique });
}
