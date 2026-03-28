import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { seedContractDraftTemplatesIfEmpty } from "@/lib/contracts/seed-contract-draft-templates";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminContractsBuilderPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/contracts-builder");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  await seedContractDraftTemplatesIfEmpty().catch(() => {});

  const templates = await prisma.contractDraftTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Contract templates (drafting)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Structured sections and fields for marketplace agreements (e.g. SELLER_AGREEMENT). Reorder sections
          and toggle required fields; attachments (e.g. seller declaration) are shown for reference.
        </p>

        <ul className="mt-8 space-y-2">
          {templates.length === 0 ? (
            <li className="text-slate-500">No templates — seed failed or DB unavailable.</li>
          ) : (
            templates.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {t.contractType} · {t.isActive ? "active" : "inactive"} · {t.slug}
                  </p>
                </div>
                <Link
                  href={`/admin/contracts-builder/${t.id}`}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: GOLD }}
                >
                  Edit
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
