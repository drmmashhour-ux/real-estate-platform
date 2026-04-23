import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const rl = checkRateLimit(`launch:track:${ip}`, { max: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let body: { event?: string; payload?: Record<string, unknown>; timestamp?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = typeof body.event === "string" ? body.event.trim().slice(0, 128) : "";
  if (!event) return Response.json({ error: "event required" }, { status: 400 });

  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const userId = await getGuestId();
  const enriched = { ...payload, ...(userId ? { userId } : {}) };

  let ts = new Date();
  if (typeof body.timestamp === "string") {
    const parsed = Date.parse(body.timestamp);
    if (!Number.isNaN(parsed)) ts = new Date(parsed);
  }

  try {
    await prisma.launchEvent.create({
      data: {
        event,
        payload: enriched as Prisma.InputJsonValue,
        timestamp: ts,
      },
    });
  } catch (e) {
    logError("POST /api/launch/track persist failed", e);
    return Response.json({ error: "persist_failed" }, { status: 500 });
  }

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
