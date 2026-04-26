import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canAccessFinanceAdminHub } from "@/lib/admin/finance-hub-access";
import { FinanceAdminHubClient } from "./FinanceAdminHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finance Admin Hub",
  description: "LECIPM operational finance — brokerage, platform, and investment domains; Québec tax; AMF private exempt workflow.",
};

export default async function FinanceAdminHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?returnUrl=${encodeURIComponent(`${prefix}/dashboard/finance-admin`)}`);
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!canAccessFinanceAdminHub(user?.role)) {
    redirect(`${prefix}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-white">Finance & compliance hub</h1>
        <p className="text-sm text-slate-400">
          Single operational surface with <strong className="text-slate-200">BROKERAGE</strong>,{" "}
          <strong className="text-slate-200">PLATFORM</strong>, and <strong className="text-slate-200">INVESTMENT</strong>{" "}
          separation. Not tax or legal advice. Default capital mode: private exempt placement only.
        </p>
      </header>
      <FinanceAdminHubClient />
    </div>
  );
}
