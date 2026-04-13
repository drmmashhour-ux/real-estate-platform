import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildRankingAdminSnapshot } from "@/lib/ranking/admin-ranking-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const snapshot = await buildRankingAdminSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Snapshot failed" },
      { status: 500 }
    );
  }
}
