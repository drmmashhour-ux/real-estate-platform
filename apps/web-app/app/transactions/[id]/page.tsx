import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TransactionDetailClient } from "./transaction-detail-client";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id },
    include: {
      propertyIdentity: true,
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      offers: { include: { counterOffers: true } },
      messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      deposits: true,
      documents: true,
      steps: true,
    },
  });

  if (!tx) notFound();
  const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
  if (!isParty) notFound();

  const myRole = tx.buyerId === userId ? "buyer" : tx.sellerId === userId ? "seller" : "broker";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/transactions" className="text-sm text-amber-400 hover:text-amber-300">← Transactions</Link>
        <h1 className="mt-4 text-2xl font-semibold">Transaction</h1>
        <p className="mt-1 text-slate-400">
          {tx.propertyIdentity.officialAddress}, {tx.propertyIdentity.municipality ?? ""} {tx.propertyIdentity.province ?? ""}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Status: {tx.status.replace(/_/g, " ")}
          {tx.frozenByAdmin && " · Frozen by admin"}
        </p>
        <TransactionDetailClient
          transactionId={tx.id}
          myRole={myRole}
          status={tx.status}
          frozenByAdmin={tx.frozenByAdmin}
          offerPrice={tx.offerPrice}
          offers={tx.offers.map((o) => ({
            id: o.id,
            offer_price: o.offerPrice,
            conditions: o.conditions,
            expiration_date: o.expirationDate,
            status: o.status,
            counter_offers: o.counterOffers.map((c) => ({
              id: c.id,
              counter_price: c.counterPrice,
              notes: c.notes,
              created_at: c.createdAt,
            })),
          }))}
          messages={tx.messages.map((m) => ({
            id: m.id,
            sender_id: m.senderId,
            sender_name: m.sender.name,
            message: m.message,
            created_at: m.createdAt,
          }))}
          deposits={tx.deposits.map((d) => ({
            id: d.id,
            amount: d.amount,
            payment_status: d.paymentStatus,
          }))}
          documents={tx.documents.map((d) => ({
            id: d.id,
            document_type: d.documentType,
            file_url: d.fileUrl,
            signed_by_buyer: d.signedByBuyer,
            signed_by_seller: d.signedBySeller,
            signed_by_broker: d.signedByBroker,
          }))}
          steps={tx.steps.map((s) => ({
            id: s.id,
            step_name: s.stepName,
            status: s.status,
          }))}
        />
      </div>
    </main>
  );
}
