import { getLegacyDB } from "@/lib/db/legacy";
import { sendEmail, sendSMS } from "@/lib/notifications/system";
import { generateReengagementMessage } from "@/lib/retention/messages";
import { query } from "@/lib/sql";
import { trackEvent } from "@/src/services/analytics";

const prisma = getLegacyDB();

const RATE_WINDOW_MS = 3 * 86_400_000;

export type InactiveUserRow = { id: string; email: string };

/**
 * Users with no recent activity (Order 53). Uses `last_active_at` when set, else
 * `createdAt` (coalesce) so new installs without a heartbeat are still catchable.
 */
export async function findInactiveUsers() {
  return await query<InactiveUserRow>(`
    SELECT u.id, u.email
    FROM "User" u
    WHERE COALESCE(u."last_active_at", u."createdAt") < NOW() - INTERVAL '3 days'
  `);
}

/**
 * Distinct users with high-intent signals in the last 30 days (Order 58; same window as growth brain).
 */
/** Best-effort city from latest LISTING_VIEW metadata (Order 58 personalization). */
export async function getLastViewedListingCity(userId: string): Promise<string | null> {
  try {
    const rows = await query<{ city: string | null }>(
      `
      SELECT NULLIF(TRIM(metadata->>'city'), '') AS city
      FROM "user_events"
      WHERE "user_id" = $1
        AND "eventType"::text = 'LISTING_VIEW'
        AND metadata->>'city' IS NOT NULL
      ORDER BY "created_at" DESC
      LIMIT 1
    `,
      [userId]
    );
    const c = rows[0]?.city?.trim();
    return c || null;
  } catch {
    return null;
  }
}

export async function userHasHighIntent(userId: string): Promise<boolean> {
  try {
    const rows = await query<{ n: string | null }>(
      `
      SELECT COUNT(*)::text AS n
      FROM "user_events"
      WHERE "user_id" = $1
        AND "eventType"::text IN ('BOOKING_START', 'CHECKOUT_START', 'PAYMENT_SUCCESS', 'LISTING_VIEW', 'SEARCH_PERFORMED')
        AND "created_at" > NOW() - INTERVAL '30 days'
    `,
      [userId]
    );
    const n = Math.max(0, Math.floor(Number.parseInt(rows[0]?.n ?? "0", 10) || 0));
    return n > 0;
  } catch {
    return false;
  }
}

function daysBetween(d: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - d.getTime()) / 86_400_000));
}

export type ReengagementBatchRow = {
  userId: string;
  /** Account email (identity / email channel recipient). */
  email: string;
  channel: "email" | "sms";
  /** SMS body when `channel === "sms"`. */
  sms?: string;
  /** When `channel === "email"`. */
  subject?: string;
  body?: string;
};

/**
 * Eligible re-engagement rows: inactive users, marketing consent, not opted out via pause,
 * 3-day per-user rate cap, and generated copy. Default path is not sending — use API dry run.
 */
export async function prepareReengagementBatch(): Promise<ReengagementBatchRow[]> {
  const inactive = await findInactiveUsers().catch(() => [] as InactiveUserRow[]);
  if (inactive.length === 0) return [];

  const ids = inactive.map((r) => r.id);
  const now = new Date();
  const rateCutoff = new Date(now.getTime() - RATE_WINDOW_MS);

  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      growthMessagingPaused: false,
      OR: [{ marketingEmailOptIn: true }, { marketingSmsOptIn: true }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      homeCity: true,
      marketingEmailOptIn: true,
      marketingSmsOptIn: true,
      lastReengagementMessageAt: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  const out: ReengagementBatchRow[] = [];

  for (const u of users) {
    if (u.lastReengagementMessageAt && u.lastReengagementMessageAt > rateCutoff) {
      continue;
    }
    if (!u.marketingEmailOptIn && !u.marketingSmsOptIn) continue;

    const lastTouch = u.lastActiveAt ?? u.createdAt;
    const daysInactive = daysBetween(lastTouch, now);
    const highIntent = await userHasHighIntent(u.id);
    const lastViewedCity = await getLastViewedListingCity(u.id);
    const preferredCity = lastViewedCity ?? u.homeCity;

    const pack = generateReengagementMessage({
      name: u.name,
      homeCity: u.homeCity,
      daysInactive,
      highIntent,
      preferredCity,
    });

    if (u.marketingEmailOptIn) {
      out.push({
        userId: u.id,
        email: u.email,
        channel: "email",
        subject: pack.email.subject,
        body: pack.email.body,
      });
      continue;
    }
    if (u.marketingSmsOptIn && u.phone?.trim() && pack.sms) {
      out.push({
        userId: u.id,
        email: u.email,
        channel: "sms",
        sms: pack.sms,
      });
    }
  }

  return out;
}

async function logReengagement(
  userId: string,
  channel: "email" | "sms",
  subject: string | null,
  bodyPreview: string,
  dryRun: boolean
) {
  const prev = bodyPreview.slice(0, 2000);
  await prisma.reengagementMessageLog.create({
    data: { userId, channel, subject: subject ?? undefined, bodyPreview: prev, dryRun },
  });
}

/**
 * Manual send path (Order 58). Validates against a fresh `prepareReengagementBatch()` slice; updates rate cap + audit log.
 * **Not** called automatically. Stubs only — no ESP/SMS provider.
 */
export async function sendReengagementToUsers(
  userIds: string[],
  opts: { adminUserId?: string | null } = {}
): Promise<{ results: { userId: string; status: "sent" | "skipped"; reason?: string }[] }> {
  const batch = await prepareReengagementBatch();
  const byId = new Map(batch.map((b) => [b.userId, b]));
  const results: { userId: string; status: "sent" | "skipped"; reason?: string }[] = [];

  for (const id of userIds) {
    const row = byId.get(id);
    if (!row) {
      results.push({ userId: id, status: "skipped", reason: "not_eligible_or_no_consent_or_rate_limited" });
      continue;
    }

    if (row.channel === "email" && row.subject && row.body) {
      sendEmail(id, row.subject, row.body);
    } else if (row.channel === "sms" && row.sms) {
      sendSMS(id, row.sms);
    } else {
      results.push({ userId: id, status: "skipped", reason: "missing_payload" });
      continue;
    }

    await prisma.user.update({
      where: { id },
      data: { lastReengagementMessageAt: new Date() },
    });
    await logReengagement(id, row.channel, row.subject ?? null, row.body ?? row.sms ?? "", false);
    void trackEvent("reengagement_sent", { userId: id, channel: row.channel }, { userId: opts.adminUserId ?? undefined });
    results.push({ userId: id, status: "sent" });
  }

  return { results };
}

/**
 * @deprecated use `prepareReengagementBatch` with dry run via API. Kept for backward compatibility.
 */
export async function triggerReengagement() {
  const users = await findInactiveUsers();
  for (const user of users) {
    // eslint-disable-next-line no-console
    console.log(`[triggerReengagement] legacy no-op for ${user.email} — use prepareReengagementBatch + admin send`);
  }
}
