import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AiApprovalQueuePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/automation/approvals`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Admin · approvals
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">AI approval queue</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Stage 1 does not enqueue AI drafts for bulk execution. When Stage 2+ enables draft sends and publishes, items will surface
            here and in existing governance / notification channels — no bypass of human review for high-risk classes.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin/automation`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Automation center
        </Link>
      </div>

      <section className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-8 text-center text-sm text-[#737373]">
        Queue empty — no pending AI-generated actions requiring approval.
      </section>
    </div>
  );
}
