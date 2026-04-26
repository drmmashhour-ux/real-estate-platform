import type { Metadata } from "next";

import { CommandCenterView } from "@/components/command-center/CommandCenterView";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { loadCommandCenterPagePayload } from "@/modules/command-center/command-center-page.service";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const metadata: Metadata = {
  title: "LECIPM Command Center",
  description: "Executive operations overview — revenue, pipeline, trust, growth, and approvals in one surface.",
};

export const dynamic = "force-dynamic";

export default async function LecipmCommandCenterPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return null;
  }

  const initial = await loadCommandCenterPagePayload(userId, user.role);

  return <CommandCenterView initial={initial} />;
}
