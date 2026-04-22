import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { recordPlatformEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** POST /api/operators/waitlist — public apply (rate-limited). */
export async function POST(req: Request) {
  const gate = await gateDistributedRateLimit(req, "operators:waitlist:apply", { windowMs: 60_000, max: 10 });
  if (!gate.allowed) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 256) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : "";
  const residenceName =
    typeof body.residenceName === "string" ? body.residenceName.trim().slice(0, 512) : "";
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 160) : "";
  const phone =
    typeof body.phone === "string" && body.phone.trim() ? body.phone.trim().slice(0, 64) : null;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Name and valid email required" }, { status: 400 });
  }
  if (!residenceName || !city) {
    return NextResponse.json({ error: "Residence name and city required" }, { status: 400 });
  }

  try {
    const row = await prisma.operatorWaitlist.create({
      data: {
        name,
        email,
        residenceName,
        city,
        phone,
        status: "PENDING",
      },
    });

    void recordPlatformEvent({
      eventType: "operator_waitlist_submitted",
      sourceModule: "operators/waitlist",
      entityType: "OperatorWaitlist",
      entityId: row.id,
      payload: { city, residenceName: residenceName.slice(0, 80) },
    }).catch(() => {});
  } catch (e) {
    console.error("[operators/waitlist]", e);
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "You're on the waitlist — we'll contact you if a spot opens in your area.",
    },
    { headers: gate.responseHeaders }
  );
}
