import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getBnhubHostListingCountForUser } from "@/lib/bnhub/supabaseHostListings";
import { getMobileAuthUser, resolveMobileAppRole } from "@/lib/mobile/mobileAuth";
import { resolvePrismaIdentitySubjectUserId } from "@/lib/mobile/resolvePrismaIdentitySubjectUserId";

export const dynamic = "force-dynamic";

function identityVerificationPayload(idv: { verificationStatus: string } | null): {
  isVerified: boolean;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
} {
  if (!idv) {
    return { isVerified: false, verificationStatus: "unverified" };
  }
  const s = idv.verificationStatus.toLowerCase() as "pending" | "verified" | "rejected";
  if (s === "verified") return { isVerified: true, verificationStatus: "verified" };
  if (s === "rejected") return { isVerified: false, verificationStatus: "rejected" };
  return { isVerified: false, verificationStatus: "pending" };
}

export async function GET(request: Request) {
  const authUser = await getMobileAuthUser(request);
  if (!authUser) {
    return Response.json({ error: "Unauthorized", hint: "Send Authorization: Bearer <supabase_access_token>" }, { status: 401 });
  }
  const prismaHostCount = await prisma.shortTermListing.count({ where: { ownerId: authUser.id } });
  const supaId = await getSupabaseAuthIdFromRequest(request);
  const bnhubHostCount = supaId ? await getBnhubHostListingCountForUser(supaId) : 0;
  const appRole = resolveMobileAppRole(authUser, prismaHostCount, bnhubHostCount);
  const prismaSubjectId = await resolvePrismaIdentitySubjectUserId(authUser);
  const idvRow = prismaSubjectId
    ? await prisma.identityVerification.findUnique({
        where: { userId: prismaSubjectId },
        select: { verificationStatus: true },
      })
    : null;
  const identity = identityVerificationPayload(idvRow);
  const trustUser = prismaSubjectId
    ? await prisma.user.findUnique({
        where: { id: prismaSubjectId },
        select: {
          bnhubGuestTrustScore: true,
          bnhubGuestTotalStays: true,
          bnhubGuestRatingAverage: true,
        },
      })
    : null;
  const trustScore = trustUser?.bnhubGuestTrustScore ?? 50;
  const totalStays = trustUser?.bnhubGuestTotalStays ?? 0;
  const rating = trustUser?.bnhubGuestRatingAverage ?? null;
  const trustBadges: string[] = [];
  if (identity.isVerified) trustBadges.push("verified");
  if (trustScore >= 78 && totalStays >= 3) trustBadges.push("trusted_guest");

  return Response.json({
    user: {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      platformRole: authUser.role,
      isVerified: identity.isVerified,
      verificationStatus: identity.verificationStatus,
      trustScore,
      totalStays,
      rating,
    },
    identityVerification: identity,
    trust: {
      trustScore,
      totalStays,
      rating,
      badges: trustBadges,
    },
    appRole,
    hostListingCount: prismaHostCount,
    bnhubHostListingCount: bnhubHostCount,
  });
}
