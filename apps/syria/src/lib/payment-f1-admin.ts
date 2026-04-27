import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

/**
 * Logged-in admin OR `Authorization: Bearer <secret>` for confirm/reject APIs.
 * Secret: `FI_ADMIN_SECRET` or `SYRIA_PAYMENT_ADMIN_SECRET` (first non-empty).
 */
export async function requireF1Admin(req: Request): Promise<NextResponse | null> {
  const admin = await getAdminUser();
  if (admin) return null;

  const secret = (process.env.FI_ADMIN_SECRET ?? process.env.SYRIA_PAYMENT_ADMIN_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "payment_admin_not_configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return null;
}
