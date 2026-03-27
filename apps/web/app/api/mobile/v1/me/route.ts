import { prisma } from "@/lib/db";
import { getMobileAuthUser, resolveMobileAppRole } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getMobileAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Unauthorized", hint: "Send Authorization: Bearer <supabase_access_token>" }, { status: 401 });
  }
  const hostCount = await prisma.shortTermListing.count({ where: { ownerId: authUser.id } });
  const appRole = resolveMobileAppRole(authUser, hostCount);
  return Response.json({
    user: {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      platformRole: authUser.role,
    },
    appRole,
    hostListingCount: hostCount,
  });
}
