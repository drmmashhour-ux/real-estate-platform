import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getProductInsightsEngineSnapshot } from "@/lib/insights/product-insights-engine";
import { InsightsDashboard } from "./insights-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/insights");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/");

  let data;
  try {
    data = await getProductInsightsEngineSnapshot();
  } catch (e) {
    console.error("[admin/insights]", e);
    throw e;
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Insights engine</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
          Turn real usage into the next product bet: conversion, retention signals, feature mix, and qualitative feedback —
          all from your database.
        </p>
        <div className="mt-10">
          <InsightsDashboard data={data} />
        </div>
      </div>
    </main>
  );
}
