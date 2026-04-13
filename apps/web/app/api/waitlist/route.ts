import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export const dynamic = "force-dynamic";

/** POST /api/waitlist — growth engine email capture → `growth_waitlist`. */
export async function POST(req: Request) {
  const gate = await gateDistributedRateLimit(req, "growth:waitlist", { windowMs: 60_000, max: 15 });
  if (!gate.allowed) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    await prisma.waitlist.upsert({
      where: { email },
      create: { email },
      update: {},
    });
  } catch {
    return NextResponse.json({ error: "Could not save email" }, { status: 500 });
  }

  void persistLaunchEvent("WAITLIST_SIGNUP", { email });

  return NextResponse.json({ ok: true }, { headers: gate.responseHeaders });
}
