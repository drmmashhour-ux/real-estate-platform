import type { Metadata } from "next";
import { ExecutionDashboardShell } from "@/components/execution/ExecutionDashboardShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import Link from "next/link";

export const metadata: Metadata = {
  title: "Execution desk",
  description: "LECIPM autonomous execution — queued tasks, approvals, and safe automation.",
};

export const dynamic = "force-dynamic";

export default async function ExecutionDeskPage() {
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

  return <ExecutionDashboardShell />;
}
