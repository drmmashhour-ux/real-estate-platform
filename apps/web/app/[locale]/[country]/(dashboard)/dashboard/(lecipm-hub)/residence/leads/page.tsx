import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { resolveSeniorHubAccess, canAccessResidenceDashboard } from "@/lib/senior-dashboard/role";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResidenceLeadsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) redirect(base);
  const access = await resolveSeniorHubAccess(userId, user.role);
  if (!canAccessResidenceDashboard(access) || access.kind === "residence_manager") {
    redirect(`${base}/senior`);
  }

  return (
    <div className="p-6 text-sm text-zinc-100">
      <p className="text-xs uppercase text-amber-200/80">Residence</p>
      <h1 className="mt-2 text-xl font-semibold">All leads</h1>
      <p className="mt-2 text-zinc-400">Use the main residence overview for the lead queue — full table wiring can hook here.</p>
      <Link href={`${base}/residence`} className="mt-6 inline-block text-teal-400 underline">
        ← Overview
      </Link>
    </div>
  );
}
