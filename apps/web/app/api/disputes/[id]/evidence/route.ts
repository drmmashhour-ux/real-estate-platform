import { requireUser } from "@/modules/security/access-guard.service";
import { collectEvidence } from "@/modules/disputes/workflow.engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/disputes/[id]/evidence — add evidence to a dispute
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { url, description } = body;

    if (!url) {
      return NextResponse.json({ error: "Evidence URL is required" }, { status: 400 });
    }

    const evidence = await collectEvidence(id, url, description);

    return NextResponse.json({ ok: true, evidence });
  } catch (error) {
    console.error("[dispute:api] evidence add failed", error);
    return NextResponse.json({ error: "Failed to add evidence" }, { status: 500 });
  }
}
