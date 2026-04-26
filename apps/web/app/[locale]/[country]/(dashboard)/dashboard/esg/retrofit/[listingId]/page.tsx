import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { EsgRetrofitListingClient } from "@/components/esg/EsgRetrofitListingClient";

export const metadata = {
  title: "ESG Retrofit plan",
  description: "Phased retrofit roadmap and financing matcher.",
};

export default async function EsgRetrofitListingPage(props: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/esg/retrofit");

  const { listingId } = await props.params;
  if (!listingId?.trim()) notFound();

  const allowed = await prisma.listing.findFirst({
    where: {
      id: listingId,
      OR: [{ ownerId: userId }, { brokerAccesses: { some: { brokerId: userId } } }],
    },
    select: { id: true },
  });

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!allowed && admin?.role !== "ADMIN") notFound();

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <EsgRetrofitListingClient listingId={listingId} />
      </div>
    </main>
  );
}
