import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { EsgRetrofitPortfolioClient } from "@/components/esg/EsgRetrofitPortfolioClient";

export const metadata = {
  title: "ESG Retrofit portfolio",
  description: "Portfolio-wide retrofit and financing signals.",
};

export default async function EsgRetrofitPortfolioPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/esg/retrofit");

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <EsgRetrofitPortfolioClient />
      </div>
    </main>
  );
}
