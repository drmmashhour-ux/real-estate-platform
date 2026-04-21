import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { EsgActionCenterPortfolioClient } from "@/components/esg/EsgActionCenterPortfolioClient";

export const metadata = {
  title: "ESG Action Center",
  description: "Portfolio-wide prioritized ESG execution roadmap.",
};

export default async function EsgActionCenterPortfolioPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/esg/action-center");

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <EsgActionCenterPortfolioClient />
      </div>
    </main>
  );
}
