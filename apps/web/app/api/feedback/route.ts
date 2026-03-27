import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getFeedbackRatingSummary } from "@/lib/feedback/rating-summary";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().max(8000).optional(),
  page: z.string().max(512).optional(),
});

/** POST — save feedback (logged-in users get userId; anonymous OK). GET ?summary=1 — public average rating. */
export async function GET(req: NextRequest) {
  const summary = req.nextUrl.searchParams.get("summary");
  if (summary === "1") {
    const data = await getFeedbackRatingSummary();
    return NextResponse.json({
      average: data?.average ?? null,
      count: data?.count ?? 0,
    });
  }
  return NextResponse.json({ error: "Use ?summary=1 for aggregate stats." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`user-feedback:${ip}`, { max: 20, windowMs: 86_400_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Rating (1–5) is required." }, { status: 400 });
  }

  const { rating, message, page } = parsed.data;
  const userId = await getGuestId().catch(() => null);

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[api/feedback] DATABASE_URL is not set — feedback cannot be persisted.");
    return NextResponse.json({ ok: false, error: "Could not save feedback." }, { status: 503 });
  }

  try {
    await prisma.userFeedback.create({
      data: {
        rating,
        message: message?.trim() || null,
        page: page?.trim() || null,
        userId: userId ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientInitializationError) {
      console.error("[api/feedback] DB unreachable or misconfigured:", e.message);
    } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[api/feedback] Prisma", e.code, e.meta);
    } else {
      console.error("[api/feedback]", e);
    }
    return NextResponse.json({ ok: false, error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
