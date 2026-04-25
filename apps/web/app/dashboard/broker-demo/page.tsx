import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { BrokerDemoClient } from "./BrokerDemoClient";

export const metadata: Metadata = {
  title: "3-minute broker demo | LECIPM",
  description: "Short, outcome-only walkthrough: priority deal, insight, next action, pipeline, onboarding.",
};

export const dynamic = "force-dynamic";

export default async function BrokerDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    redirect("/auth/login?next=/dashboard/broker-demo");
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN && user.role !== PlatformRole.OPERATOR) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const demoParam = sp.demo === "true" || sp.demo === "1";

  return (
    <div className="min-h-screen bg-[#050505]">
      <BrokerDemoClient userRole={user.role} initialDemoParam={demoParam} />
    </div>
  );
}
