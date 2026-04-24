import Link from "next/link";

export const dynamic = "force-dynamic";

/** Entry point for automation / AI tooling — deeper modules stay in legacy admin routes for now. */
export default async function AdminAiActionsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-8">
      <h1 className="text-xl font-semibold text-white">AI actions</h1>
      <p className="mt-3 max-w-xl text-sm text-zinc-400">
        Orchestrate recommendations, approvals, and autopilot flows. Full controls live in automation modules.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`${dash}/admin/automation`}
          className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20"
        >
          Open automation
        </Link>
        <Link href={`${dash}/admin/automation/approvals`} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
          Approvals queue
        </Link>
      </div>
    </div>
  );
}
