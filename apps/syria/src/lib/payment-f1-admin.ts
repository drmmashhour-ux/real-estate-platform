import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

/**
 * Admin session OR `Authorization: Bearer ${SYRIA_PAYMENT_ADMIN_SECRET}` for confirm/reject APIs.
 * Returns `NextResponse` when not allowed; otherwise `null`.
 */
export async function requireF1Admin(req: Request): Promise<NextResponse | null> {
  const admin = await getAdminUser();
  if (admin) return null;

  const secret = (process.env.SYRIA_PAYMENT_ADMIN_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "payment_admin_not_configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return null;
}
