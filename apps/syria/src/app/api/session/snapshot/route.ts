import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/**
 * Minimal session snapshot for offline read-only UI (no secrets in body).
 */
export async function GET() {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ userId: null, role: null, savedAt: Date.now() });
  }
  return NextResponse.json({
    userId: u.id,
    role: u.role,
    savedAt: Date.now(),
  });
}
