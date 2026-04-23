import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { EsgActionCenterAssetClient } from "@/components/esg/EsgActionCenterAssetClient";

export const metadata = {
  title: "ESG Action Center — Asset",
  description: "Prioritized ESG actions for this listing.",
};

export default async function EsgActionCenterAssetPage(props: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/esg/action-center");

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
        <EsgActionCenterAssetClient listingId={listingId} />
      </div>
    </main>
  );
}
