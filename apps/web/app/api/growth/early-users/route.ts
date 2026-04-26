import { getEarlyUserCount } from "@/lib/growth/earlyUsers";

export const dynamic = "force-dynamic";

/**
 * Public count for “first 100 users” / growth displays (Order 44).
 */
export async function GET() {
  return Response.json({ count: await getEarlyUserCount() });
}
