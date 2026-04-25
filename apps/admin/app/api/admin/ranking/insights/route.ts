import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { updateRankingSignalsFromBehavior } from "@/src/modules/ranking/feedbackEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const snap = await updateRankingSignalsFromBehavior();
    return NextResponse.json(snap);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Insights failed" },
      { status: 500 }
    );
  }
}
