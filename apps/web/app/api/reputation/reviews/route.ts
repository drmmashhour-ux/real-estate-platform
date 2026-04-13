import { NextResponse } from "next/server";
import type { ReputationEntityType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { createReputationReview } from "@/lib/reputation/create-review";

export const dynamic = "force-dynamic";

const ALLOWED: ReputationEntityType[] = ["host", "broker", "seller", "listing", "buyer"];

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    subjectEntityType?: string;
    subjectEntityId?: string;
    listingId?: string | null;
    rating?: number;
    title?: string | null;
    body?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const t = body.subjectEntityType as ReputationEntityType | undefined;
  if (!t || !ALLOWED.includes(t)) {
    return NextResponse.json({ error: "Invalid subjectEntityType" }, { status: 400 });
  }
  if (!body.subjectEntityId?.trim()) {
    return NextResponse.json({ error: "subjectEntityId required" }, { status: 400 });
  }
  if (body.rating == null || !Number.isFinite(body.rating)) {
    return NextResponse.json({ error: "rating required" }, { status: 400 });
  }

  try {
    const row = await createReputationReview({
      authorUserId: userId,
      subjectEntityType: t,
      subjectEntityId: body.subjectEntityId.trim(),
      listingId: body.listingId ?? undefined,
      rating: body.rating,
      title: body.title,
      body: body.body,
    });
    return NextResponse.json({ id: row.id, status: row.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
