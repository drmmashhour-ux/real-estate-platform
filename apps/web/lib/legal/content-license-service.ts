import { prisma } from "@/lib/db";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";

const POLICY_ID = "global";

export async function ensureContentLicensePolicyRow(): Promise<void> {
  await prisma.contentLicensePolicy.upsert({
    where: { id: POLICY_ID },
    create: { id: POLICY_ID, currentVersion: CONTENT_LICENSE_VERSION },
    update: {},
  });
}

export async function getRequiredContentLicenseVersion(): Promise<string> {
  await ensureContentLicensePolicyRow();
  const row = await prisma.contentLicensePolicy.findUnique({
    where: { id: POLICY_ID },
    select: { currentVersion: true },
  });
  return row?.currentVersion?.trim() || CONTENT_LICENSE_VERSION;
}

export async function userHasCurrentContentLicense(userId: string): Promise<boolean> {
  const required = await getRequiredContentLicenseVersion();
  const acc = await prisma.contentLicenseAcceptance.findUnique({
    where: { userId },
    select: { version: true },
  });
  return Boolean(acc && acc.version === required);
}

export async function recordContentLicenseAcceptance(userId: string, version: string): Promise<void> {
  await prisma.contentLicenseAcceptance.upsert({
    where: { userId },
    create: { userId, version, acceptedAt: new Date() },
    update: { version, acceptedAt: new Date() },
  });
}

export async function setContentLicensePolicyVersion(version: string, adminUserId: string): Promise<void> {
  const v = version.trim().slice(0, 32);
  if (!v) throw new Error("Invalid version");
  await prisma.contentLicensePolicy.upsert({
    where: { id: POLICY_ID },
    create: { id: POLICY_ID, currentVersion: v, updatedByUserId: adminUserId },
    update: { currentVersion: v, updatedByUserId: adminUserId },
  });
}
