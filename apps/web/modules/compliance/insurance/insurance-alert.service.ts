import { prisma } from "@/lib/db";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { logInsurance } from "./insurance-log";

export async function triggerInsuranceAlerts(brokerId: string, trigger: "EXPIRY" | "EXPIRED" | "CLAIM" | "RISK", metadata?: any) {
  try {
    const broker = await prisma.user.findUnique({
      where: { id: brokerId },
      select: { id: true, name: true, email: true },
    });

    if (!broker) return;

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    let title = "";
    let message = "";
    let priority: "NORMAL" | "HIGH" | "URGENT" = "NORMAL";

    switch (trigger) {
      case "EXPIRY":
        title = "Insurance Expiring Soon";
        message = `Your professional liability insurance is expiring on ${metadata?.expiryDate}. Please renew to maintain your insured status.`;
        priority = "HIGH";
        break;
      case "EXPIRED":
        title = "Insurance Expired";
        message = "Your professional liability insurance has expired. Your insured badge has been removed, and some features may be restricted.";
        priority = "URGENT";
        break;
      case "CLAIM":
        title = "Insurance claim received";
        message = `We recorded your professional liability claim${metadata?.claimId ? ` (${metadata.claimId})` : ""}. Compliance may follow up — keep documents on file.`;
        priority = "HIGH";
        break;
      case "RISK":
        title = "High Risk Alert";
        message = `Compliance risk score for broker ${broker.name} has exceeded threshold: ${metadata?.score}. Review required.`;
        priority = "URGENT";
        break;
    }

    await createNotification({
      userId: brokerId,
      type: "SYSTEM",
      title,
      message,
      priority: priority as any,
      metadata: { trigger, ...metadata },
    });

    // Notify Admins
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "SYSTEM",
        title: `[ADMIN] ${trigger === "CLAIM" ? "New Insurance Claim Filed" : title}`,
        message:
          trigger === "CLAIM"
            ? `Claim intake for broker ${broker.name}${metadata?.claimId ? ` — id ${metadata.claimId}` : ""}. Review compliance hub.`
            : `${message} (Broker: ${broker.name})`,
        priority: priority as any,
        metadata: { trigger, brokerId, ...metadata },
      });
    }

    logInsurance("audit_alert_triggered", { brokerId, trigger, priority, metadataKeys: metadata ? Object.keys(metadata) : [] });
  } catch (e) {
    logInsurance("alert_trigger_error", { brokerId, trigger, err: e instanceof Error ? e.message : "unknown" });
  }
}

export async function checkExpiringInsurance() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

  const expiringSoon = await prisma.brokerInsurance.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gt: now,
        lte: thirtyDaysFromNow,
      },
    },
    select: { brokerId: true, endDate: true },
  });

  for (const policy of expiringSoon) {
    await triggerInsuranceAlerts(policy.brokerId, "EXPIRY", { expiryDate: policy.endDate.toISOString() });
  }

  const justExpired = await prisma.brokerInsurance.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lte: now,
      },
    },
    select: { id: true, brokerId: true },
  });

  for (const policy of justExpired) {
    await prisma.brokerInsurance.update({
      where: { id: policy.id },
      data: { status: "EXPIRED" },
    });
    await triggerInsuranceAlerts(policy.brokerId, "EXPIRED");
  }
}
