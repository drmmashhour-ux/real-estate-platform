import { requireBrokerPushEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import {
  getBrokerPushPreferences,
  upsertBrokerPushPreferences,
} from "@/modules/push-system/push-preference.service";
import type { BrokerPushCategory } from "@/modules/push-system/push.types";
import { trackMobilePushPreferenceChanged } from "@/lib/analytics/mobile-broker-analytics";
import { auditBrokerPushEvent } from "@/modules/push-system/push-audit.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<BrokerPushCategory>([
  "urgent_deadline",
  "document_received",
  "signature_completed",
  "client_reply",
  "negotiation_action",
  "payment_status",
  "closing_risk",
  "compliance",
  "high_priority_lead",
]);

export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireBrokerPushEnabled();
  if (disabled) return disabled;

  const prefs = await getBrokerPushPreferences(auth.user.id);
  return Response.json({ kind: "broker_push_preferences_v1", prefs });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireBrokerPushEnabled();
  if (disabled) return disabled;

  const body = await request.json().catch(() => ({}));
  const categories = body?.categories as Record<string, boolean> | undefined;
  const privacyMinimizeLockScreen = typeof body?.privacyMinimizeLockScreen === "boolean" ? body.privacyMinimizeLockScreen : undefined;

  const cleaned: Partial<Record<BrokerPushCategory, boolean>> = {};
  if (categories && typeof categories === "object") {
    for (const [k, v] of Object.entries(categories)) {
      if (CATEGORIES.has(k as BrokerPushCategory) && typeof v === "boolean") {
        cleaned[k as BrokerPushCategory] = v;
      }
    }
  }

  const prefs = await upsertBrokerPushPreferences(auth.user.id, {
    categories: cleaned,
    privacyMinimizeLockScreen,
  });

  trackMobilePushPreferenceChanged({ keys: Object.keys(cleaned) });
  await auditBrokerPushEvent({ actorUserId: auth.user.id, action: "push_preferences", payload: { ...cleaned } });
  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_push_preferences_updated",
    payload: {},
  });

  return Response.json({ kind: "broker_push_preferences_v1", prefs });
}
