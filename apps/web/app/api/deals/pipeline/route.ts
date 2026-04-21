import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { createPipelineDeal, listPipelineDealsForUser } from "@/modules/deals/deal-pipeline.service";

export const dynamic = "force-dynamic";

const TAG = "[deal-pipeline]";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const deals = await listPipelineDealsForUser(userId);
    return NextResponse.json({ deals });
  } catch {
    logInfo(`${TAG}`, { error: "list_failed" });
    return NextResponse.json({ error: "Failed to list pipeline deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      title?: string;
      listingId?: string | null;
      sponsorUserId?: string | null;
      priority?: string | null;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    const deal = await createPipelineDeal({
      title,
      listingId: body.listingId ?? null,
      ownerUserId: userId,
      sponsorUserId: body.sponsorUserId ?? null,
      priority: body.priority ?? null,
    });

    return NextResponse.json({ ok: true, dealId: deal.id });
  } catch (e) {
    logInfo(`${TAG}`, { createError: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
