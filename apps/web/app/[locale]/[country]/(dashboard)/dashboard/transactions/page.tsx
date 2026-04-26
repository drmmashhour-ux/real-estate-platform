import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { listTransactions } from "@/modules/transactions/transaction.service";
import { toTransactionWire } from "@/modules/transactions/transaction.types";

export const dynamic = "force-dynamic";

export default async function SdTransactionsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect(dash);
  }

  const sp = await searchParams;
  const statusQ = typeof sp.status === "string" ? sp.status : undefined;
  const brokerQ = typeof sp.brokerId === "string" ? sp.brokerId : undefined;

  const rows = await listTransactions({
    brokerId: userId,
    role: user.role,
    status: statusQ,
    brokerFilterId: user.role === "ADMIN" ? brokerQ : undefined,
  });

  const base = `/${locale}/${country}/dashboard/transactions`;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Transaction files (SD number)</h1>
      <p className="text-sm text-muted-foreground">
        One LEC-SD number per deal. <Link className="underline" href={base}>All</Link> — filter:{" "}
        <Link className="underline" href={`${base}?status=DRAFT`}>
          DRAFT
        </Link>
      </p>
      <ul className="space-y-2 text-sm">
        {rows.length === 0 ?
          <li className="text-muted-foreground">No transactions yet.</li>
        : rows.map((t) => {
            const w = toTransactionWire(t);
            return (
              <li key={w.id} className="rounded border p-3">
                <div className="font-mono text-sm font-medium">{w.transactionNumber}</div>
                <div className="text-muted-foreground">{w.status}</div>
                <div>{w.title ?? "—"}</div>
                {t.listing?.title ?
                  <div className="text-xs text-muted-foreground">Listing: {t.listing.title}</div>
                : null}
                <Link className="text-primary underline" href={`${base}/${w.id}`}>
                  Open
                </Link>
              </li>
            );
          })
        }
      </ul>
    </div>
  );
}
