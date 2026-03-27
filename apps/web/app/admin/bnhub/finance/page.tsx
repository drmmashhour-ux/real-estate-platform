import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

const links = [
  { href: "/admin/bnhub/finance/payments", label: "Payments" },
  { href: "/admin/bnhub/finance/payouts", label: "Payouts" },
  { href: "/admin/bnhub/finance/refunds", label: "Refunds" },
  { href: "/admin/bnhub/finance/disputes", label: "Disputes" },
  { href: "/admin/bnhub/finance/holds", label: "Holds" },
];

export default async function AdminBnhubFinanceHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">BNHub finance</h1>
        <p className="mt-2 text-sm text-slate-400">
          Marketplace payment engine — audit via Prisma / admin APIs. Do not describe as legal escrow unless counsel
          confirms.
        </p>
        <ul className="mt-8 space-y-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-emerald-400 hover:text-emerald-300">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
