import type { Prisma } from "@prisma/client";
import { toPrismaJson } from "@/lib/types/prisma-json";

/**
 * Use for Prisma `Json` / `InputJsonValue` columns when the value is built as a plain object
 * (`Record<string, unknown>` is not assignable to `InputJsonValue` in strict mode).
 */
export function asInputJsonValue(value: Record<string, unknown> | ReadonlyArray<unknown>): Prisma.InputJsonValue {
  return toPrismaJson(value);
}

export function asOptionalInputJsonValue(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return asInputJsonValue(value);
}
