import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { resolveSeniorHubAccess, canAccessAdminDashboard } from "@/lib/senior-dashboard/role";

export const dynamic = "force-dynamic";

export default async function AdminPlatformPage({
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
  if (!canAccessAdminDashboard(access)) redirect(`${base}/senior`);

  return (
    <div className="p-6 text-sm text-zinc-100">
      <h1 className="text-xl font-semibold">Marketplace</h1>
      <p className="mt-2 text-zinc-400">Deep marketplace controls stay in admin tools — this route anchors navigation.</p>
      <Link href={`${base}/admin`} className="mt-6 inline-block text-amber-300 underline">
        ← Operations home
      </Link>
    </div>
  );
}
