import Link from "next/link";
import type { Metadata } from "next";
import { PlatformRole } from "@prisma/client";
import { RecommendationsDebugClient } from "@/components/recommendations/RecommendationsDebugClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";

export const metadata: Metadata = {
  title: "Recommendations debug",
  description: "Internal LECIPM recommendation telemetry and factor breakdown.",
};

export const dynamic = "force-dynamic";

export default async function RecommendationsDebugPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== PlatformRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-16 text-center text-slate-300">
        <p>Administrator access is required.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#D4AF37] hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <RecommendationsDebugClient />
    </div>
  );
}
