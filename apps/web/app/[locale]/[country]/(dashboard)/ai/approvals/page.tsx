import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { ApprovalsClient } from "./approvals-client";

export default async function AiApprovalsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/approvals");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  const pending = await prisma.managerAiApprovalRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const serializable = pending.map((r) => ({
    id: r.id,
    actionKey: r.actionKey,
    targetEntityType: r.targetEntityType,
    targetEntityId: r.targetEntityId,
    createdAt: r.createdAt.toISOString(),
    requesterId: r.requesterId,
  }));

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-white">Approval queue</h1>
      <p className="mb-6 text-sm text-white/50">Sensitive AI-prepared actions require human approval.</p>
      <ApprovalsClient initial={serializable} />
    </div>
  );
}
