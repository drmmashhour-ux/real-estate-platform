import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { ExpertTermsClient } from "./expert-terms-client";

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";

export const dynamic = "force-dynamic";

export default async function ExpertTermsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/expert/terms");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!isMortgageExpertRole(user?.role)) {
    redirect("/dashboard/real-estate");
  }

  const expert = await prisma.mortgageExpert.findUnique({
    where: { userId: id },
    select: { acceptedTerms: true, name: true, expertVerificationStatus: true },
  });
  if (!expert) {
    redirect("/dashboard/real-estate");
  }
  if (expert.acceptedTerms) {
    redirect(
      expert.expertVerificationStatus === "verified"
        ? "/dashboard/expert"
        : "/dashboard/expert/verification"
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs text-[#737373] hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-6 text-2xl font-bold" style={{ color: GOLD }}>
          Expert agreement
        </h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Hi {expert?.name ?? "there"} — review and accept the platform terms to access your dashboard and receive
          assigned leads.
        </p>

         <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm leading-relaxed text-[#E5E5E5]">
          <p>
            <strong style={{ color: GOLD }}>Platform role.</strong> {PLATFORM_CARREFOUR_NAME} sends
            qualified mortgage leads to verified
            experts. By participating, you agree to work leads in good faith and honor the commercial terms below.
          </p>
          <p>
            <strong style={{ color: GOLD }}>Commission (30%).</strong> You agree to pay{" "}
            <strong>30% commission</strong> on closed deals originated through the platform (or the rate shown on your
            profile). Platform share is calculated on the final financed deal amount you report when closing.
          </p>
          <p>
            <strong style={{ color: GOLD }}>Anti-bypass.</strong> Clients introduced through the platform must remain
            within the platform for commission tracking. Circumventing the platform to avoid fees violates this
            agreement and may result in deactivation.
          </p>
          <p>
            <strong style={{ color: GOLD }}>Confidentiality &amp; conduct.</strong> You will respect client
            confidentiality and provide professional, compliant mortgage services under applicable regulations.
          </p>
        </div>

        <ExpertTermsClient />
      </div>
    </div>
  );
}
