import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SignatureEnvelopeDetailClient } from "@/components/signature-room/SignatureEnvelopeDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ envelopeId: string }>;
}): Promise<Metadata> {
  const { envelopeId } = await params;
  return { title: `Envelope ${envelopeId.slice(0, 8)} — LECIPM` };
}

export default async function DashboardSignatureEnvelopePage({
  params,
}: {
  params: Promise<{ envelopeId: string }>;
}) {
  const { envelopeId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/dashboard/signature/${envelopeId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const env = await prisma.signatureEnvelope.findUnique({
    where: { id: envelopeId },
    select: { id: true, deal: { select: { brokerId: true } } },
  });
  if (!env) notFound();
  if (user.role !== "ADMIN" && (!env.deal.brokerId || env.deal.brokerId !== userId)) {
    notFound();
  }

  return <SignatureEnvelopeDetailClient envelopeId={envelopeId} />;
}
