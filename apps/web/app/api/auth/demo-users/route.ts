import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEMO_AUTH_DISABLED_MESSAGE, isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { DEMO_ACCOUNT_EMAILS } from "@/lib/demo/demo-account-constants";

/** GET /api/auth/demo-users — List canonical demo users (`npm run demo:full`). Blocked in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isDemoAuthAllowed()) {
    return Response.json({ error: DEMO_AUTH_DISABLED_MESSAGE }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_ACCOUNT_EMAILS] } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });
  return Response.json(users);
}
