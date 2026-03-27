import type { PrismaClient } from "@prisma/client";
import type { ConversionTrigger } from "../domain/types";
import { enqueueFollowUps } from "../infrastructure/followUpAutomationService";

export async function runFollowUpAutomation(
  db: PrismaClient,
  input: { userId: string; triggers: ConversionTrigger[]; listingId?: string | null }
) {
  return enqueueFollowUps(db, input);
}
