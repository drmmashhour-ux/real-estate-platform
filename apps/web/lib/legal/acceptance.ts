/**
 * User agreement acceptance – version comparison, required docs, block logic.
 * Safe fallbacks: no crash if DB missing; allow app to run with warnings.
 */
import { prisma } from "@/lib/db";
import {
  REQUIRED_FOR_PLATFORM,
  REQUIRED_FOR_BNHUB_HOST,
  type LegalDocumentType,
} from "./constants";
import { getActiveDocument } from "./documents";

export type AcceptanceStatus = {
  documentType: string;
  version: string;
  acceptedVersion: string | null;
  acceptedAt: Date | null;
  mustAccept: boolean;
};

export async function getUserAcceptance(
  userId: string,
  documentType: string
): Promise<{ version: string; acceptedAt: Date } | null> {
  try {
    const latest = await prisma.userAgreement.findFirst({
      where: { userId, documentType },
      orderBy: { acceptedAt: "desc" },
    });
    return latest ? { version: latest.version, acceptedAt: latest.acceptedAt } : null;
  } catch (e) {
    console.warn("[legal] getUserAcceptance failed:", e);
    return null;
  }
}

export async function getRequiredAcceptancesForUser(
  userId: string,
  context: "platform" | "bnhub_host"
): Promise<AcceptanceStatus[]> {
  const types: LegalDocumentType[] =
    context === "platform" ? REQUIRED_FOR_PLATFORM : REQUIRED_FOR_BNHUB_HOST;
  const result: AcceptanceStatus[] = [];

  for (const documentType of types) {
    const active = await getActiveDocument(documentType);
    const accepted = await getUserAcceptance(userId, documentType);

    const currentVersion = active?.version ?? "";
    const acceptedVersion = accepted?.version ?? null;
    const mustAccept = currentVersion !== "" && currentVersion !== acceptedVersion;

    result.push({
      documentType,
      version: currentVersion,
      acceptedVersion,
      acceptedAt: accepted?.acceptedAt ?? null,
      mustAccept,
    });
  }
  return result;
}

/** Returns true if user has accepted all required docs for the given context (current version). */
export async function hasAcceptedRequired(
  userId: string,
  context: "platform" | "bnhub_host"
): Promise<boolean> {
  const statuses = await getRequiredAcceptancesForUser(userId, context);
  return statuses.every((s) => !s.mustAccept);
}

/** Record acceptance. Safe: logs warning on failure, does not throw. */
export async function recordAcceptance(
  userId: string,
  documentType: string,
  version: string
): Promise<boolean> {
  try {
    await prisma.userAgreement.create({
      data: { userId, documentType, version },
    });
    return true;
  } catch (e) {
    console.warn("[legal] recordAcceptance failed:", e);
    return false;
  }
}

/** Redirect path when platform terms not accepted. */
export const ACCEPTANCE_ROUTE = "/legal/accept";

/** Redirect path when host agreement not accepted (BNHub). */
export const BNHUB_HOST_AGREEMENT_ROUTE = "/bnhub/host-agreement";
