import type { Prisma } from "@prisma/client";

/** Persist TERMS + PRIVACY (required) and optional MARKETING at signup. */
export async function recordUserSignupConsents(
  tx: Prisma.TransactionClient,
  userId: string,
  opts: { marketing?: boolean }
) {
  const data: { userId: string; type: string }[] = [
    { userId, type: "TERMS" },
    { userId, type: "PRIVACY" },
  ];
  if (opts.marketing) {
    data.push({ userId, type: "MARKETING" });
  }
  await tx.userConsent.createMany({ data });
}
