import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { OperatorWaitlistAdminTable } from "@/components/operators/OperatorWaitlistAdminTable";
import { buildOperatorOnboardingUrl } from "@/lib/operator-waitlist";

export const dynamic = "force-dynamic";

export default async function OperatorWaitlistDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await ensureDynamicAuthRequest();
  const id = await getGuestId();
  if (!id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const { locale, country } = await params;
  const base = `/${locale}/${country}`;

  const raw = await prisma.operatorWaitlist.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const rows = raw.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    residenceName: r.residenceName,
    city: r.city,
    phone: r.phone,
    status: r.status,
    priority: r.priority,
    createdAt: r.createdAt.toISOString(),
    onboardingSentAt: r.onboardingSentAt?.toISOString() ?? null,
  }));

  const defaultLink = buildOperatorOnboardingUrl();

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">Admin</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold md:text-3xl">Operator waitlist</h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Approve operators to receive qualified families. Limited partners per area — exclusivity is the
              positioning.
            </p>
          </div>
          <Link
            href={`${base}/operators/apply`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
          >
            View public apply page
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-neutral-300">
          <p className="font-medium text-neutral-100">Default onboarding URL (brokers)</p>
          <p className="mt-1 break-all font-mono text-xs text-amber-200/90">{defaultLink}</p>
          <p className="mt-2 text-xs text-neutral-500">
            After approve, copy the row-specific link from the table when shown, or share this default.
          </p>
        </div>

        <OperatorWaitlistAdminTable rows={rows} defaultOnboardingUrl={defaultLink} />
      </div>
    </div>
  );
}
