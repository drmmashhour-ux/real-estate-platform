import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listSignatureEnvelopesForDashboard } from "@/modules/esignature/signature-envelope.service";
import { SignatureDashboardClient } from "@/components/signature-room/SignatureDashboardClient";

export const metadata: Metadata = {
  title: "Signatures — LECIPM",
  description: "Transaction e-signature envelopes with Québec notarial disclaimers.",
};

export const dynamic = "force-dynamic";

export default async function DashboardSignaturePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/signature");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const rows = await listSignatureEnvelopesForDashboard(userId, user.role);

  return (
    <SignatureDashboardClient
      initial={rows.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        dealId: e.dealId,
        documentHashSha256: e.documentHashSha256,
        createdAt: e.createdAt,
        deal: e.deal,
      }))}
    />
  );
}
