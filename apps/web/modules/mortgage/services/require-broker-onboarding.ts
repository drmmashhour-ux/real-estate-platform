import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { brokerHasLeadAccess } from "@/modules/mortgage/services/broker-verification";

/** `/broker/complete-profile` — logged-in user with a mortgage broker row. */
export async function requireBrokerProfilePage() {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/broker/complete-profile")}`);

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId },
    select: {
      id: true,
      profileCompletedAt: true,
      isVerified: true,
      verificationStatus: true,
      identityStatus: true,
      idDocumentUrl: true,
      selfiePhotoUrl: true,
    },
  });
  if (!broker) redirect("/auth/signup-broker");

  if (brokerHasLeadAccess(broker)) {
    redirect("/broker/dashboard");
  }

  if (
    broker.profileCompletedAt &&
    broker.idDocumentUrl?.trim() &&
    broker.selfiePhotoUrl?.trim() &&
    broker.verificationStatus !== "rejected" &&
    broker.identityStatus !== "rejected" &&
    !brokerHasLeadAccess(broker)
  ) {
    redirect("/broker/pending-review");
  }

  return { userId, brokerId: broker.id };
}

/** `/broker/pending-review` — profile submitted, awaiting admin. */
export async function requireBrokerPendingPage() {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/broker/pending-review")}`);

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId },
    select: {
      id: true,
      profileCompletedAt: true,
      isVerified: true,
      verificationStatus: true,
      identityStatus: true,
      idDocumentUrl: true,
      selfiePhotoUrl: true,
    },
  });
  if (!broker) redirect("/auth/signup-broker");

  if (!broker.profileCompletedAt) {
    redirect("/broker/complete-profile");
  }

  if (!broker.idDocumentUrl?.trim() || !broker.selfiePhotoUrl?.trim()) {
    redirect("/broker/complete-profile");
  }

  if (broker.verificationStatus === "rejected") {
    redirect("/broker/complete-profile?rejected=1");
  }

  if (broker.identityStatus === "rejected") {
    redirect("/broker/complete-profile?identity_rejected=1");
  }

  if (brokerHasLeadAccess(broker)) {
    redirect("/broker/dashboard");
  }

  return { userId, brokerId: broker.id };
}
