import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  const { id } = await context.params;
  const share = request.nextUrl.searchParams.get("share");

  const row = share
    ? await prisma.portfolioScenario.findFirst({
        where: { id, shareToken: share },
        include: { items: true, investorProfile: true },
      })
    : userId
      ? await prisma.portfolioScenario.findFirst({
          where: { id, userId },
          include: { items: true, investorProfile: true },
        })
      : null;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ scenario: row, label: "estimate" });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const row = await prisma.portfolioScenario.findFirst({ where: { id, userId } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { title?: string } | null;
  if (!body?.title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const updated = await prisma.portfolioScenario.update({
    where: { id },
    data: { title: body.title.slice(0, 200) },
  });
  return NextResponse.json({ ok: true, scenario: updated });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const row = await prisma.portfolioScenario.findFirst({ where: { id, userId } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.portfolioScenario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
