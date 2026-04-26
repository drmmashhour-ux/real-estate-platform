import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { redirect } from "next/navigation";
import { resolveSeniorHubAccess, canAccessManagementDashboard } from "@/lib/senior-dashboard/role";

export const dynamic = "force-dynamic";

export default async function ManagementPortfolioPage({
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
  if (!canAccessManagementDashboard(access)) redirect(`${base}/senior`);

  return (
    <div className="p-6 text-sm text-zinc-100">
      <h1 className="text-xl font-semibold">Residences</h1>
      <p className="mt-2 text-zinc-400">Portfolio detail view — start from the management overview table.</p>
      <Link href={`${base}/management`} className="mt-6 inline-block text-teal-400 underline">
        ← Overview
      </Link>
    </div>
  );
}
