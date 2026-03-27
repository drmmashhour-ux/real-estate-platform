import type { LecipmConversionSubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export function mapStripeStatusToConversion(
  status: string | undefined
): LecipmConversionSubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
    case "unpaid":
      return "expired";
    default:
      return "incomplete";
  }
}

export async function syncUserPlanFromConversionCode(userId: string, planCode: string) {
  const plan = planCode === "team" ? "team" : "pro";
  await prisma.user.updateMany({
    where: { id: userId },
    data: { plan },
  });
}
