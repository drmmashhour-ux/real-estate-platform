import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const leads = await prisma.bnhubLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { listing: { select: { title: true, city: true } } },
  });

  return (
    <HubLayout title="Growth leads" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white">Leads</h1>
        <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 text-sm">
          {leads.map((l) => (
            <li key={l.id} className="px-4 py-3 text-zinc-300">
              <span className="font-medium text-white">{l.fullName ?? "—"}</span> · {l.email} ·{" "}
              <span className="text-amber-400/90">{l.leadTemperature}</span> · score {l.leadScore} · {l.sourceType}
              {l.listing ? (
                <span className="block text-xs text-zinc-500">{l.listing.title}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
