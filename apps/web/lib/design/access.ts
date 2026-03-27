/**
 * Design trial lock: access status from a DesignAccess record.
 * Used by /api/design/access and frontend to show/hide Canva, AI, templates.
 */

export type DesignAccessRecord = {
  trialEnd: Date;
  isPaid: boolean;
};

export type DesignAccessStatusValue = "no-trial" | "paid" | "expired" | "active";

export function getDesignAccessStatus(
  record: DesignAccessRecord | null
): DesignAccessStatusValue {
  const now = new Date();

  if (!record) return "no-trial";

  if (record.isPaid) return "paid";

  if (now > record.trialEnd) return "expired";

  return "active";
}

export function getDaysRemaining(record: DesignAccessRecord | null): number | null {
  if (!record) return null;
  const now = new Date();
  if (now > record.trialEnd) return 0;
  const ms = record.trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
