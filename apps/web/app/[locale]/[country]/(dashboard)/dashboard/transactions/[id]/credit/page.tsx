import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TransactionCreditChecksPanel } from "@/components/transactions/TransactionCreditChecksPanel";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { getTransactionById } from "@/modules/transactions/transaction.service";

export const dynamic = "force-dynamic";

export default async function TransactionCreditPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const dash = `/${locale}/${country}/dashboard`;
  const base = `${dash}/transactions`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect(dash);
  }

  const row = await getTransactionById(id);
  if (!row) notFound();
  if (!canAccessTransaction(user.role, userId, row.brokerId)) {
    redirect(base);
  }

  const checks = await prisma.lecipmTenantCreditCheck.findMany({
    where: { transactionId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4 text-sm">
      <div className="flex flex-wrap gap-3">
        <Link className="text-primary underline" href={`${base}/${id}`}>
          ← Transaction {row.transactionNumber}
        </Link>
      </div>
      <TransactionCreditChecksPanel
        transactionId={id}
        initialChecks={checks.map((c) => ({
          id: c.id,
          applicantName: c.applicantName,
          email: c.email,
          status: c.status,
          score: c.score,
          reportUrl: c.reportUrl,
          provider: c.provider,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
