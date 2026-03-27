import { prisma } from "@/lib/db";
import { mortgageDistributionScore } from "@/modules/mortgage/services/distribution-score";

export type PublicMortgageExpertCard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  totalDeals: number;
  plan: string;
  distributionScore: number;
  badges: string[];
};

export async function getPublicMortgageExpertsList(): Promise<PublicMortgageExpertCard[]> {
  const rows = await prisma.mortgageExpert.findMany({
    where: { isActive: true, acceptedTerms: true, isAvailable: true },
    orderBy: { createdAt: "asc" },
    include: { expertSubscription: true },
  });

  const enriched: PublicMortgageExpertCard[] = rows.map((e) => {
    const pw = e.expertSubscription?.isActive ? e.expertSubscription.priorityWeight : 0;
    const score = mortgageDistributionScore({
      rating: e.rating,
      adminRatingBoost: e.adminRatingBoost,
      totalDeals: e.totalDeals,
      priorityWeight: pw,
    });
    const plan = e.expertSubscription?.isActive ? e.expertSubscription.plan : "basic";
    const badges: string[] = [];
    if (e.reviewCount >= 5) badges.push("Verified");
    if (plan === "premium") badges.push("Priority");
    if (e.revenueFeaturedExpert) badges.push("Featured");
    if (e.revenuePremiumPlacement) badges.push("Premium placement");
    return {
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      photo: e.photo,
      company: e.company,
      title: e.title,
      bio: e.bio,
      rating: e.rating,
      reviewCount: e.reviewCount,
      totalDeals: e.totalDeals,
      plan,
      distributionScore: Math.round(score * 100) / 100,
      badges,
    };
  });

  enriched.sort((a, b) => b.distributionScore - a.distributionScore);
  if (enriched[0]) {
    enriched[0].badges = [...new Set(["Top Expert", ...enriched[0].badges])];
  }

  return enriched;
}
