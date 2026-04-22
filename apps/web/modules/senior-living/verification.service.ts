import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[senior.verification]";

/** Manual / admin verification pipeline — toggles residence.verified after operator diligence. */
export async function verifyResidence(residenceId: string, verified: boolean): Promise<void> {
  await prisma.seniorResidence.update({
    where: { id: residenceId },
    data: { verified },
  });
  logInfo(TAG, { residenceId, verified });
}

/** Record future compliance payloads (registration #, attestations). Stored on residence via optional JSON extension later. */
export async function attachVerificationNotes(
  residenceId: string,
  notes: { registrationRef?: string; reviewedByUserId?: string }
): Promise<void> {
  logInfo(TAG, { residenceId, notes });
}
