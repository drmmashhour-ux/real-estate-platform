import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listActionsForUser } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const take = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("take") || 40)));
  const actions = await listActionsForUser(userId, take);
  return NextResponse.json({ actions });
}
