import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LeadDetailClient } from "./lead-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Lead ${id.slice(0, 8)}… | CRM` };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerId = await getGuestId();
  if (!viewerId) redirect(`/login?next=/dashboard/leads/${id}`);

  const user = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!lead) notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const viralInviteUrl = `${base}/invite?ref=${encodeURIComponent(viewerId)}`;

  return <LeadDetailClient leadId={id} viralInviteUrl={viralInviteUrl} />;
}
