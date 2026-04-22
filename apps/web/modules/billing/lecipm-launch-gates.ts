import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { assertEarlyBrokerAccess } from "@/modules/growth/broker-acquisition.service";
import { freeMonthlyTransactionCap } from "./lecipm-launch-constants";
import { billingGateApplies, getEffectiveLaunchPlan } from "./lecipm-launch-subscription";
import { countUsageInMonth } from "./lecipm-launch-usage";

export type LaunchBillingAction = "TRANSACTION" | "DOCUMENT_GENERATE" | "SIGNATURE_SEND" | "CREDIT_CHECK";

export async function assertBrokerLaunchBilling(args: {
  brokerUserId: string;
  actorRole: PlatformRole;
  action: LaunchBillingAction;
}): Promise<void> {
  if (!billingGateApplies(args.actorRole)) return;

  await assertEarlyBrokerAccess(args.brokerUserId, args.actorRole);

  const plan = await getEffectiveLaunchPlan(args.brokerUserId);

  if (args.action === "TRANSACTION") {
    if (plan === "FREE") {
      const cap = freeMonthlyTransactionCap();
      const n = await countUsageInMonth(args.brokerUserId, "TRANSACTION");
      if (n >= cap) {
        throw new Error(
          `Subscription limit reached: FREE plan allows ${cap} transactions per calendar month. Upgrade to PRO or AGENCY.`
        );
      }
    }
    return;
  }

  if (plan === "FREE") {
    if (args.action === "DOCUMENT_GENERATE") {
      throw new Error("Document generation requires PRO or higher (FREE plan).");
    }
    if (args.action === "SIGNATURE_SEND") {
      throw new Error("Sending signature packets requires PRO or higher (FREE plan).");
    }
    if (args.action === "CREDIT_CHECK") {
      throw new Error("Tenant credit verification requires PRO or higher (FREE plan).");
    }
  }

  if ((plan === "FREE" || plan === "PRO") && args.action === "CREDIT_CHECK") {
    /* PRO includes credit checks per spec */
  }
}

/** Optional: block non-brokers from SD tools at service layer when early access is on. */
export async function assertBrokerUserForEarlyAccess(userId: string, role: PlatformRole): Promise<void> {
  if (!engineFlags.earlyBrokerV1) return;
  if (role === "ADMIN") return;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (u?.role !== "BROKER") {
    throw new Error("LECIPM SD transaction tools require a broker account.");
  }
}
