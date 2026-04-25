import { NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { getDreamHomePlaybookRecommendations, suggestDreamHomePlaybookAssignment } from "@/modules/dream-home/services/dream-home-playbook.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") ?? undefined;
  const segment: Record<string, unknown> = {};
  if (city) {
    segment.city = city;
  }
  segment.source = "dream_home_playbooks_get";
  const recs = await getDreamHomePlaybookRecommendations({ segment });
  const createAssignment =
    url.searchParams.get("createAssignment") === "1" || url.searchParams.get("createAssignment") === "true";
  let assignment: Awaited<ReturnType<typeof suggestDreamHomePlaybookAssignment>> = null;
  if (createAssignment) {
    const entityId = url.searchParams.get("entityId")?.trim() || undefined;
    const userId = await getSessionUserIdFromRequest(req).catch(() => null);
    try {
      assignment = await suggestDreamHomePlaybookAssignment({ entityId, segment, userId });
    } catch {
      assignment = null;
    }
  }
  return NextResponse.json({
    ok: true,
    playbooks: recs,
    ...(createAssignment ? { assignment } : {}),
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (b.mode === "assign") {
    const segment =
      b.segment && typeof b.segment === "object" && !Array.isArray(b.segment)
        ? (b.segment as Record<string, unknown>)
        : {};
    const entityId = typeof b.entityId === "string" ? b.entityId : undefined;
    const res = await suggestDreamHomePlaybookAssignment({ entityId, segment });
    return NextResponse.json({ ok: true, assignment: res });
  }
  const segment =
    b.segment && typeof b.segment === "object" && !Array.isArray(b.segment)
      ? (b.segment as Record<string, unknown>)
      : {};
  const merged = { ...segment, source: "dream_home_playbooks_post" };
  const recs = await getDreamHomePlaybookRecommendations({ segment: merged });
  const createAssignment = b.createAssignment === true || b.createAssignment === "true" || b.createAssignment === 1;
  let assignment: Awaited<ReturnType<typeof suggestDreamHomePlaybookAssignment>> = null;
  if (createAssignment) {
    const entityId = typeof b.entityId === "string" ? b.entityId : undefined;
    const userId = typeof b.userId === "string" ? b.userId : undefined;
    try {
      assignment = await suggestDreamHomePlaybookAssignment({ entityId, segment: merged, userId });
    } catch {
      assignment = null;
    }
  }
  return NextResponse.json({
    ok: true,
    playbooks: recs,
    ...(createAssignment ? { assignment } : {}),
  });
}
