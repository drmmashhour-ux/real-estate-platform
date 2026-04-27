import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = { channel?: "email" | "sms" | "both" };

/**
 * Order 58 — marketing opt-out. Authenticated user only; sets `marketingEmailOptIn` / `marketingSmsOptIn` to false.
 * After unsubscribe, the user is excluded from `prepareReengagementBatch` (no consent).
 */
export async function POST(req: Request) {
  const id = await getGuestId();
  if (!id) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let channel: Body["channel"] = "both";
  try {
    const b = (await req.json()) as Body;
    if (b?.channel === "email" || b?.channel === "sms" || b?.channel === "both") {
      channel = b.channel;
    }
  } catch {
    /* default both */
  }

  const data: { marketingEmailOptIn?: boolean; marketingSmsOptIn?: boolean } = {};
  if (channel === "email" || channel === "both") data.marketingEmailOptIn = false;
  if (channel === "sms" || channel === "both") data.marketingSmsOptIn = false;

  await prisma.user.update({ where: { id }, data });

  return Response.json({ ok: true, channel });
}
