import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const toolKey = String(body.toolKey ?? "");
  const eventType = String(body.eventType ?? "view");
  const city = body.city != null ? String(body.city) : undefined;
  const payloadJson =
    typeof body.payload === "object" && body.payload !== null ? body.payload : undefined;

  if (!toolKey) return NextResponse.json({ error: "toolKey required" }, { status: 400 });

  const userId = await getGuestId();

  await prisma.toolUsageEvent.create({
    data: {
      toolKey,
      eventType,
      city,
      userId: userId ?? undefined,
      payloadJson: payloadJson as object | undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
