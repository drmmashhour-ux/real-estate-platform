import { requireBrokerPushEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { upsertPushDeviceForUser } from "@/lib/mobile/upsert-push-device";
import { auditBrokerPushEvent } from "@/modules/push-system/push-audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireBrokerPushEnabled();
  if (disabled) return disabled;

  const body = await request.json().catch(() => ({}));
  try {
    const device = await upsertPushDeviceForUser(auth.user.id, body);
    await auditBrokerPushEvent({ actorUserId: auth.user.id, action: "push_register", payload: { deviceId: device.id } });
    return Response.json({ ok: true, device: { ...device, lastSeenAt: device.lastSeenAt.toISOString() } });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Error";
    return Response.json({ error: message }, { status });
  }
}
