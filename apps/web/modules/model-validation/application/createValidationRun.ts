import type { PrismaClient } from "@prisma/client";
import type { CreateValidationRunInput } from "../domain/validation.types";
import { createRun } from "../infrastructure/validationRepository";

export async function createValidationRun(db: PrismaClient, input: CreateValidationRunInput) {
  return createRun(db, input);
}
