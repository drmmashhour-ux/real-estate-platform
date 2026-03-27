import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runDeclarationValidation } from "@/src/modules/seller-declaration-ai/application/runDeclarationValidation";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const payload = (body.payload ?? {}) as Record<string, unknown>;
  const result = await runDeclarationValidation({ payload, actorUserId: userId });
  return NextResponse.json(result);
}
