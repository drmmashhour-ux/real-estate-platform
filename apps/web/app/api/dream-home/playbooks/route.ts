import { NextResponse } from "next/server";
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
  const recs = await getDreamHomePlaybookRecommendations({ segment });
  return NextResponse.json({ ok: true, playbooks: recs });
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
  const segment = b.segment && typeof b.segment === "object" && !Array.isArray(b.segment) ? b.segment : {};
  const recs = await getDreamHomePlaybookRecommendations({ segment: segment as Record<string, unknown> });
  return NextResponse.json({ ok: true, playbooks: recs });
}
