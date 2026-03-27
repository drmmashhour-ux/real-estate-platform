import { prisma } from "@/lib/db";
import { defaultMortgageTrialEndsAt } from "@/modules/mortgage/services/mortgage-trial";

export type PrimaryMortgageBroker = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

/**
 * Resolve env for the single trusted primary broker (receives all mortgage leads).
 * Prefer MORTGAGE_PRIMARY_*; fall back to BROKER_EMAIL for email when set.
 */
function primaryBrokerEnv() {
  const name =
    process.env.MORTGAGE_PRIMARY_BROKER_NAME?.trim() || "Primary Mortgage Partner";
  const email =
    process.env.MORTGAGE_PRIMARY_BROKER_EMAIL?.trim() ||
    process.env.BROKER_EMAIL?.trim() ||
    "mortgage@lecipm.com";
  const phone =
    process.env.MORTGAGE_PRIMARY_BROKER_PHONE?.trim() || "+1 (514) 555-0100";
  const company = process.env.MORTGAGE_PRIMARY_BROKER_COMPANY?.trim() || "LECIPM Mortgage Partners";
  return { name, email, phone, company };
}

/** If DB is empty, create a placeholder row (then upgraded by ensurePrimaryMortgageBroker). */
export async function ensureMortgageBrokerPoolExists(): Promise<void> {
  const count = await prisma.mortgageBroker.count();
  if (count > 0) return;
  const { name, email, phone, company } = primaryBrokerEnv();
  await prisma.mortgageBroker.create({
    data: {
      name,
      email,
      phone,
      company,
      plan: "trial",
      trialEndsAt: defaultMortgageTrialEndsAt(),
      isPrimary: true,
      licenseNumber: "",
      isVerified: true,
      verificationStatus: "verified",
      identityStatus: "verified",
    },
  });
}

/**
 * Ensures exactly one primary broker exists, is marked isPrimary, plan pro, and contact fields match env.
 * All new mortgage requests should assign `brokerId` to this row.
 */
export async function ensurePrimaryMortgageBroker(): Promise<PrimaryMortgageBroker> {
  await ensureMortgageBrokerPoolExists();

  const { name, email, phone, company } = primaryBrokerEnv();

  const primary = await prisma.mortgageBroker.findFirst({
    where: { isPrimary: true },
  });

  if (primary) {
    await prisma.mortgageBroker.updateMany({
      where: { id: { not: primary.id } },
      data: { isPrimary: false },
    });
    const updated = await prisma.mortgageBroker.update({
      where: { id: primary.id },
      data: {
        name,
        email,
        phone,
        company,
        plan: "pro",
        isPrimary: true,
        trialEndsAt: null,
        licenseNumber: "",
        isVerified: true,
        verificationStatus: "verified",
        identityStatus: "verified",
      },
      select: { id: true, email: true, name: true, phone: true },
    });
    return updated;
  }

  const oldest = await prisma.mortgageBroker.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!oldest) {
    const created = await prisma.mortgageBroker.create({
      data: {
        name,
        email,
        phone,
        company,
        plan: "pro",
        isPrimary: true,
        trialEndsAt: null,
        licenseNumber: "",
        isVerified: true,
        verificationStatus: "verified",
        identityStatus: "verified",
      },
      select: { id: true, email: true, name: true, phone: true },
    });
    return created;
  }

  await prisma.mortgageBroker.updateMany({
    where: { isPrimary: true },
    data: { isPrimary: false },
  });

  const promoted = await prisma.mortgageBroker.update({
    where: { id: oldest.id },
    data: {
      name,
      email,
      phone,
      company,
      plan: "pro",
      isPrimary: true,
      trialEndsAt: null,
      licenseNumber: "",
      isVerified: true,
      verificationStatus: "verified",
      identityStatus: "verified",
    },
    select: { id: true, email: true, name: true, phone: true },
  });
  return promoted;
}
