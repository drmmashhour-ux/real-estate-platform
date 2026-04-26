import type { Metadata } from "next";
import Link from "next/link";
import { OpportunitiesDashboardShell } from "@/components/opportunity-discovery/OpportunitiesDashboardShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const metadata: Metadata = {
  title: "Opportunity Discovery",
  description: "Explainable opportunity signals for LECIPM — advisory only.",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return null;

  if (user.role !== "BROKER" && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-16 text-center text-neutral-300">
        <p>Broker or administrator access is required.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#D4AF37] hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <OpportunitiesDashboardShell />;
}
