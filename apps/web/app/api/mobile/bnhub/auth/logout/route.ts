import { NextRequest, NextResponse } from "next/server";
import { revokeDbSessionByToken } from "@/lib/auth/db-session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  await revokeDbSessionByToken(token);
  return NextResponse.json({ ok: true });
}
