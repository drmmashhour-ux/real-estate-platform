import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents, isDemoEventName } from "@/lib/demo-event-types";

export const dynamic = "force-dynamic";

/** POST — staging page_view / feature pings from the client. */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const userId = await getGuestId().catch(() => null);
  let body: { event?: string; path?: string; metadata?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = typeof body.event === "string" ? body.event.trim() : "";
  const candidate = raw === "" ? DemoEvents.PAGE_VIEW : raw;
  if (!isDemoEventName(candidate)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path : undefined;
  await trackDemoEvent(
    candidate,
    {
      ...(path ? { path } : {}),
      ...(body.metadata ?? {}),
    },
    userId
  );
  return NextResponse.json({ ok: true });
}
