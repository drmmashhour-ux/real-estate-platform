import type { LecipmFormInstanceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const ORDER: LecipmFormInstanceStatus[] = [
  "draft",
  "ai_generated",
  "broker_review",
  "client_review",
  "signed",
  "archived",
];

export function canTransition(from: LecipmFormInstanceStatus, to: LecipmFormInstanceStatus): boolean {
  if (from === to) return true;
  const i = ORDER.indexOf(from);
  const j = ORDER.indexOf(to);
  if (i < 0 || j < 0) return false;
  /** Allow forward progression or archive from any pre-signed state. */
  if (to === "archived") return from !== "signed";
  return j >= i;
}

export async function setFormInstanceStatus(id: string, status: LecipmFormInstanceStatus) {
  const row = await prisma.lecipmFormInstance.findUnique({ where: { id } });
  if (!row) throw new Error("Not found");
  if (!canTransition(row.status, status)) {
    throw new Error(`Invalid status transition ${row.status} → ${status}`);
  }
  return prisma.lecipmFormInstance.update({ where: { id }, data: { status } });
}
