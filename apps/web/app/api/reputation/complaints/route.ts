import { NextResponse } from "next/server";
import type { ReputationEntityType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { createReputationComplaint } from "@/lib/reputation/create-complaint";

export const dynamic = "force-dynamic";

const ALLOWED: ReputationEntityType[] = ["host", "broker", "seller", "listing", "buyer"];

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { entityType?: string; entityId?: string; category?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const t = body.entityType as ReputationEntityType | undefined;
  if (!t || !ALLOWED.includes(t) || !body.entityId?.trim()) {
    return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
  }

  try {
    const row = await createReputationComplaint({
      entityType: t,
      entityId: body.entityId.trim(),
      reportedByUserId: userId,
      category: body.category ?? "general",
      description: body.description ?? "",
    });
    return NextResponse.json({ id: row.id, status: row.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
