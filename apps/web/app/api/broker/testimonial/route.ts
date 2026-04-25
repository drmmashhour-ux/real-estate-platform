import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, homeCity: true },
  });
  if (!user || user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
  const name = typeof body.name === "string" ? body.name.trim() : user.name?.trim() ?? "";
  const city = typeof body.city === "string" ? body.city.trim() : user.homeCity?.trim() ?? "";

  if (!quote || quote.length < 8) {
    return NextResponse.json({ error: "Please add a short quote (a few words)." }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }
  if (!name || !city) {
    return NextResponse.json({ error: "Name and city are required." }, { status: 400 });
  }

  const existing = await prisma.testimonial.findFirst({ where: { brokerId: userId } });
  if (existing) {
    return NextResponse.json({ error: "You already submitted a testimonial." }, { status: 409 });
  }

  const row = await prisma.testimonial.create({
    data: {
      brokerId: userId,
      name: name.slice(0, 200),
      role: "Broker",
      city: city.slice(0, 120),
      quote: quote.slice(0, 5000),
      rating,
      isApproved: false,
    },
  });

  return NextResponse.json({ id: row.id, ok: true });
}
