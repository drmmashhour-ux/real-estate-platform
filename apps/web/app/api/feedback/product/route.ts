import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  liked: z.string().max(8000).optional(),
  confusing: z.string().max(8000).optional(),
  suggestions: z.string().max(8000).optional(),
  path: z.string().max(512).optional(),
  /** Optional 1–5 overall rating */
  rating: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`product-feedback:${ip}`, { max: 15, windowMs: 86_400_000 });
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid fields." }, { status: 400 });
  }

  const { liked, confusing, suggestions, path, rating } = parsed.data;
  if (!liked?.trim() && !confusing?.trim() && !suggestions?.trim()) {
    return NextResponse.json({ ok: false, error: "Please share at least one field." }, { status: 400 });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 512) ?? null;
  const userId = await getGuestId().catch(() => null);

  const parts: string[] = [];
  if (liked?.trim()) parts.push(`What you liked: ${liked.trim()}`);
  if (confusing?.trim()) parts.push(`What was confusing: ${confusing.trim()}`);
  if (suggestions?.trim()) parts.push(`Suggestions: ${suggestions.trim()}`);
  if (path?.trim()) parts.push(`Page: ${path.trim()}`);
  const message = parts.join("\n\n");

  try {
    const [uf, pf] = await prisma.$transaction([
      prisma.userFeedback.create({
        data: {
          message,
          rating: rating ?? null,
          page: path?.trim() || null,
          userId: userId ?? null,
        },
      }),
      prisma.productFeedback.create({
        data: {
          liked: liked?.trim() || null,
          confusing: confusing?.trim() || null,
          suggestions: suggestions?.trim() || null,
          path: path?.trim() || null,
          userAgent: ua,
        },
      }),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.info("[product-feedback] saved", { userFeedback: uf.id, legacy: pf.id });
    }
  } catch (e) {
    console.error("[product-feedback]", e);
    return NextResponse.json({ ok: false, error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
