/**
 * Routes platform business events to:
 * - `platform_events` row (audit)
 * - Admin email + SMS (`notify.ts`)
 * - Expo push tokens for ADMIN users (`push.service`)
 *
 * Queue workers and webhooks should call `dispatchBusinessEventToChannels`.
 */

import type { PlatformBusinessEvent } from "./platform-events";
import { persistBusinessPlatformEvent } from "./platform-event-persist.service";
import {
  formatPlatformBusinessEventBody,
  notifyPlatformBusinessEvent,
  type DispatchAdminNotificationInput,
} from "./notify";
import { sendExpoPushToAdminUsers } from "./push.service";

export type DispatchChannelsOptions = {
  /** Future: enqueue mobile push per end-user id (beyond admin broadcast). */
  notifyUserIds?: string[];
};

export async function dispatchBusinessEventToChannels(
  event: PlatformBusinessEvent,
  notifyOverrides?: Parameters<typeof notifyPlatformBusinessEvent>[1],
  _options?: DispatchChannelsOptions,
): Promise<{ adminEmailOk: boolean; adminSmsOk: boolean; pushOk: boolean }> {
  await persistBusinessPlatformEvent(event).catch((e) =>
    console.error("[dispatchBusinessEventToChannels] persist failed", e),
  );

  const res = await notifyPlatformBusinessEvent(event, notifyOverrides);

  const body = notifyOverrides?.bodyText ?? formatPlatformBusinessEventBody(event);
  const title =
    notifyOverrides?.subject?.trim() ??
    (`LECIPM · ${event.type.replace(/_/g, " ").toLowerCase()}` as const);

  let pushOk = false;
  try {
    pushOk = await sendExpoPushToAdminUsers(title, body);
  } catch (e) {
    console.error("[dispatchBusinessEventToChannels] push failed", e);
  }

  void _options?.notifyUserIds;

  return { adminEmailOk: res.emailOk, adminSmsOk: res.smsOk, pushOk };
}

/** Alias for docs / external integrations. */
export const handlePlatformEvent = dispatchBusinessEventToChannels;

/** Typed helper for cron / scripts that already build admin copy. */
export async function dispatchAdminCopy(input: DispatchAdminNotificationInput): Promise<{
  adminEmailOk: boolean;
  adminSmsOk: boolean;
  pushOk: boolean;
}> {
  await persistBusinessPlatformEvent(input.event).catch((e) =>
    console.error("[dispatchAdminCopy] persist failed", e),
  );
  const res = await notifyPlatformBusinessEvent(input.event, {
    subject: input.subject,
    bodyText: input.bodyText,
    adminEmail: input.adminEmail,
    adminSms: input.adminSms,
  });
  const body = input.bodyText ?? formatPlatformBusinessEventBody(input.event);
  const title = input.subject ?? `LECIPM · ${input.event.type.replace(/_/g, " ").toLowerCase()}`;
  let pushOk = false;
  try {
    pushOk = await sendExpoPushToAdminUsers(title, body);
  } catch (e) {
    console.error("[dispatchAdminCopy] push failed", e);
  }
  return { adminEmailOk: res.emailOk, adminSmsOk: res.smsOk, pushOk };
}
