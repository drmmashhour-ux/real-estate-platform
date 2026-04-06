import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const LINKS: { title: string; desc: string; href: string }[] = [
  { title: "Market settings", desc: "Fees, taxes, and regional defaults.", href: "/admin/market-settings" },
  { title: "BNHub finance", desc: "Payments, holds, and reconciliation.", href: "/admin/bnhub/finance/payments" },
  { title: "Stripe Connect", desc: "Host onboarding and Connect health.", href: "/admin/bnhub/payments/onboarding" },
  { title: "Growth & launch", desc: "Launch ops and feature flags.", href: "/admin/launch-ops" },
  { title: "Content & SEO", desc: "Blog, SEO, and marketing surfaces.", href: "/admin/seo-blog" },
  { title: "Legal & contracts", desc: "Templates and enforceable flows.", href: "/admin/legal" },
  { title: "Test mode", desc: "E2E and staging controls.", href: "/admin/test-mode" },
];

export default async function AdminSettingsHubPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform configuration is split across specialized admin modules. Stripe secrets are never shown in the UI.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-5 transition hover:border-zinc-700"
            >
              <p className="font-semibold text-white">{l.title}</p>
              <p className="mt-2 text-sm text-zinc-500">{l.desc}</p>
              <span className="mt-3 inline-block text-xs text-zinc-400">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </LecipmControlShell>
  );
}
