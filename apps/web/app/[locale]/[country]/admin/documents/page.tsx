import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DOCS_LINKS: { label: string; desc: string; href: string }[] = [
  { label: "Forms & submissions", desc: "Inbound requests and structured data.", href: "/admin/forms" },
  { label: "Contracts builder", desc: "Template and clause library.", href: "/admin/contracts-builder" },
  { label: "Enforceable contracts", desc: "Signed agreements and enforcement.", href: "/admin/enforceable-contracts" },
  { label: "Legal AI", desc: "Review queue and AI-assisted drafts.", href: "/admin/legal-ai" },
  { label: "Legal (ops)", desc: "Policies and operational legal.", href: "/admin/legal" },
  { label: "Listing compliance", desc: "Regulatory checks on inventory.", href: "/admin/listing-compliance" },
];

export default async function AdminDocumentsHubPage() {
  await requireAdminControlUserId();

  const [pendingForms, riskAlerts] = await Promise.all([
    prisma.formSubmission
      .count({
        where: { NOT: { status: { in: ["completed", "rejected"] } } },
      })
      .catch(() => 0),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Central entry for forms, contracts, and legal workflows — not a raw file store.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
          <strong className="font-medium">Requests snapshot:</strong>{" "}
          <span className="text-zinc-300">{pendingForms.toLocaleString()} form submissions not completed/rejected.</span>{" "}
          <Link href="/admin/forms" className="underline">
            Open forms →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DOCS_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-5 transition hover:border-zinc-600"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-2 text-xs text-zinc-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs" style={{ color: "#D4AF37" }}>
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </LecipmControlShell>
  );
}
