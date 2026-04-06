import { redirect } from "next/navigation";
import { requireAdminSession } from "./require-admin";

/** ADMIN-only surfaces; accountants are sent back to `/admin` home. */
export async function requireAdminControlUserId(): Promise<string> {
  const s = await requireAdminSession();
  if (!s.ok) {
    redirect(s.status === 401 ? "/auth/login?returnUrl=/admin" : "/admin");
  }
  return s.userId;
}
