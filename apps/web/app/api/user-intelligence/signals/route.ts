import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { listSignals, recordSignal } from "@/modules/user-intelligence/services/user-preference-signal.service";
import type { UserPreferenceSignalInput } from "@/modules/user-intelligence/types/user-intelligence.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    const take = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("take") ?? 40) || 40));
    const r = await listSignals(u.id, take);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error, signals: [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, signals: r.data });
  } catch {
    return NextResponse.json({ ok: false, error: "signals_unavailable", signals: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    let body: Partial<UserPreferenceSignalInput> = {};
    try {
      body = (await req.json()) as Partial<UserPreferenceSignalInput>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const r = await recordSignal({
      userId: u.id,
      sourceDomain: body.sourceDomain ?? "USER",
      sourceType: body.sourceType ?? "api",
      sourceId: body.sourceId,
      signalKey: String(body.signalKey ?? ""),
      signalValue: body.signalValue,
      signalWeight: body.signalWeight,
      confidence: body.confidence,
      explicitUserProvided: body.explicitUserProvided ?? true,
      derivedFromBehavior: body.derivedFromBehavior ?? false,
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 200 });
    }
    return NextResponse.json({ ok: true, id: r.data.id });
  } catch {
    return NextResponse.json({ ok: false, error: "signals_unavailable" }, { status: 200 });
  }
}
