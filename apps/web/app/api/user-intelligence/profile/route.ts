import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { createSnapshot, getProfile, rebuildProfile } from "@/modules/user-intelligence/services/user-preference-profile.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    const p = await getProfile(u.id);
    if (!p.ok) {
      return NextResponse.json({ ok: false, error: p.error }, { status: 200 });
    }
    return NextResponse.json({ ok: true, profile: p.data });
  } catch {
    return NextResponse.json({ ok: false, error: "profile_unavailable" }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    let body: { rebuild?: boolean; snapshot?: boolean } = {};
    try {
      body = (await req.json()) as { rebuild?: boolean; snapshot?: boolean };
    } catch {
      /* */
    }
    if (body.rebuild) {
      const r = await rebuildProfile(u.id, { userId: u.id, trigger: "rebuild" });
      if (!r.ok) {
        return NextResponse.json({ ok: false, error: r.error }, { status: 200 });
      }
      if (body.snapshot) {
        await createSnapshot(u.id, "user_request", "manual");
      }
      return NextResponse.json({ ok: true, profile: r.data });
    }
    const p = await getProfile(u.id);
    return NextResponse.json({ ok: p.ok, profile: p.ok ? p.data : null, error: p.ok ? undefined : p.error });
  } catch {
    return NextResponse.json({ ok: false, error: "profile_unavailable" }, { status: 200 });
  }
}
