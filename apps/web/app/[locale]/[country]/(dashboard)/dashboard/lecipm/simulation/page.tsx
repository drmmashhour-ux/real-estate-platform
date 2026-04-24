import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SimulationSandboxClient } from "./simulation-sandbox-client";

import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Marketplace simulation (What-if)",
  description: "Simulate marketplace parameter changes with predicted impact — does not affect live data.",
};

export const dynamic = "force-dynamic";

export default async function LecipmSimulationPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/lecipm");
  }

  const cities = await prisma.city.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return <SimulationSandboxClient cityOptions={cities} />;
}
