import { Prisma } from "@prisma/client";

/** Normalize arbitrary JSON-shaped values for Prisma `Json` / `InputJsonValue` columns (strict TS). */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
