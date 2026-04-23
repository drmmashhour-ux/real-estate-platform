import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { runTaskEvals } from "@/modules/ai-training/application/runTaskEvals";
import { buildRetrievalAugmentedResponse } from "@/modules/copilot/infrastructure/retrievalAugmentedResponseBuilder";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const subsystem = typeof body?.subsystem === "string" ? body.subsystem : "copilot";
  const name = typeof body?.name === "string" ? body.name : `eval-${Date.now()}`;
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  const out = await runTaskEvals(prisma, {
    subsystem,
    name,
    items: items.map((i: any) => ({
      inputPayload: i?.inputPayload ?? {},
      expectedOutput: i?.expectedOutput ?? null,
    })),
    runner: async (item) => {
      const query = String(item.inputPayload.query ?? "What should I do next?");
      const listingId = typeof item.inputPayload.listingId === "string" ? item.inputPayload.listingId : undefined;
      const result = await buildRetrievalAugmentedResponse({
        query,
        userId: admin.userId,
        listingId,
        intent: "eval",
      });
      const expectedContains = typeof item.expectedOutput?.mustContain === "string" ? item.expectedOutput.mustContain : null;
      const passed = expectedContains ? result.summary.toLowerCase().includes(expectedContains.toLowerCase()) : true;
      return {
        actualOutput: { summary: result.summary, grounded: result.grounded },
        passed,
        notes: passed ? "OK" : "missing expected phrase",
      };
    },
  });

  return NextResponse.json({ ok: true, ...out });
}
