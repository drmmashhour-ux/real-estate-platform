import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { syncHostOnboardingCompleteFromStripe } from "@/lib/stripe/hostConnectExpress";

export const dynamic = "force-dynamic";

/**
 * Stripe Connect return_url — reads account from Stripe; sets stripeOnboardingComplete from details_submitted only.
 */
export default async function DashboardStripeSuccessPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/dashboard/stripe/success");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });
  if (!user?.stripeAccountId?.trim()) {
    redirect("/dashboard/host/payouts");
  }

  if (!isStripeConfigured()) {
    redirect("/dashboard/host/payouts?stripe_error=not_configured");
  }
  const stripe = getStripe();
  if (!stripe) {
    redirect("/dashboard/host/payouts?stripe_error=not_configured");
  }

  try {
    await syncHostOnboardingCompleteFromStripe(stripe, userId, user.stripeAccountId.trim());
  } catch {
    /* non-fatal — user can refresh status from payouts */
  }

  redirect("/dashboard/host/payouts?connected=1");
}
