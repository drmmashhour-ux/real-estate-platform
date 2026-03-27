import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isLaunchMetricKey } from "@/lib/launch-tracking/metrics";
import { getLaunchTrackingPayload, incrementLaunchMetric } from "@/lib/launch-tracking/service";
import { parseOptionalDateIso } from "@/lib/launch-tracking/utc-day";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  metric: z.string(),
  delta: z.number().int().optional(),
  date: z.string().optional(),
});

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") || 30)));
  try {
    const payload = await getLaunchTrackingPayload(days);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[launch-tracking GET]", e);
    return NextResponse.json({ error: "Failed to load launch metrics" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!isLaunchMetricKey(parsed.data.metric)) {
    return NextResponse.json({ error: "Unknown metric" }, { status: 400 });
  }
  const delta = parsed.data.delta ?? 1;
  const date = parseOptionalDateIso(parsed.data.date);
  try {
    const row = await incrementLaunchMetric({
      metric: parsed.data.metric,
      delta,
      date,
    });
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[launch-tracking POST]", e);
    return NextResponse.json({ error: "Failed to update metric" }, { status: 500 });
  }
}
