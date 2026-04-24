import { requireAdmin } from "@/modules/security/access-guard.service";
import { summarizeCapitalBuckets, suggestCapitalAllocationAcrossEntities } from "@/modules/empire/capital-control.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [summary, suggestions] = await Promise.all([
      summarizeCapitalBuckets(),
      suggestCapitalAllocationAcrossEntities(),
    ]);
    return NextResponse.json({ summary, suggestions });
  } catch (error) {
    console.error("[empire:api] capital failed", error);
    return NextResponse.json({ error: "Failed to fetch capital data" }, { status: 500 });
  }
}
