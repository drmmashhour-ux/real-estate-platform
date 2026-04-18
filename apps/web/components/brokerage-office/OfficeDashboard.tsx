import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getDefaultOfficeIdForUser } from "@/lib/brokerage/office-access";
import { prisma } from "@/lib/db";
import { brokerageOfficeDisclaimer } from "@/modules/brokerage-office/office-explainer";
import { OfficeNav } from "./OfficeNav";

export async function OfficeDashboard({
  userId,
  basePath,
}: {
  userId: string;
  basePath: string;
}) {
  if (!brokerageOfficeFlags.officeManagementV1) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-zinc-400">
        Office management is disabled. Set{" "}
        <code className="text-amber-200/90">FEATURE_OFFICE_MANAGEMENT_V1=1</code> or{" "}
        <code className="text-amber-200/90">FEATURE_RESIDENTIAL_OFFICE_MANAGEMENT_V1=1</code>.
      </div>
    );
  }

  const officeId = await getDefaultOfficeIdForUser(userId);
  if (!officeId) {
    return (
      <div className="space-y-4">
        <OfficeNav basePath={basePath} active="" />
        <div className="rounded-2xl border border-amber-500/25 bg-black/40 p-8">
          <h2 className="text-lg font-semibold text-amber-100">Create your brokerage office</h2>
          <p className="mt-2 text-sm text-zinc-400">
            POST <code className="text-xs text-amber-200/80">/api/broker/office</code> with{" "}
            <code className="text-xs">{`{ "name": "…" }`}</code> or use the onboarding action when wired. v1 supports one
            primary office per broker account.
          </p>
          <p className="mt-4 text-xs text-zinc-500">{brokerageOfficeDisclaimer()}</p>
        </div>
      </div>
    );
  }

  const office = await prisma.brokerageOffice.findUnique({
    where: { id: officeId },
    include: {
      settings: true,
      memberships: { take: 8, include: { user: { select: { name: true, email: true } } } },
    },
  });

  return (
    <div className="space-y-8">
      <OfficeNav basePath={basePath} active="" />
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-500/90">Brokerage office</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-white">{office?.name ?? "Office"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">{brokerageOfficeDisclaimer()}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Members</p>
          <p className="mt-2 text-3xl font-semibold text-amber-100">{office?.memberships.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Office code</p>
          <p className="mt-2 font-mono text-lg text-zinc-200">{office?.officeCode ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-black p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Currency</p>
          <p className="mt-2 text-lg text-zinc-200">{office?.settings?.defaultCurrency ?? "CAD"}</p>
        </div>
      </div>
    </div>
  );
}
