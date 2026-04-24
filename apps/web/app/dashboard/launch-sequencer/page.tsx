import type { Metadata } from "next";
import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { LaunchSequenceDashboard } from "@/components/launch-sequencer/LaunchSequenceDashboard";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { generateLaunchSequence } from "@/modules/launch-sequencer/launch-sequencer.engine";

export const metadata: Metadata = {
  title: "Launch Sequencer AI",
  description: "Scenario-based market rollout planning — advisory only.",
};

export const dynamic = "force-dynamic";

export default async function LaunchSequencerPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== PlatformRole.ADMIN && user.role !== PlatformRole.BROKER)) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-16 text-center text-neutral-300">
        <p>Administrator or broker access is required.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#D4AF37] hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const initial = generateLaunchSequence();
  return (
    <div className="min-h-screen bg-[#050505]">
      <LaunchSequenceDashboard initial={initial} />
    </div>
  );
}
