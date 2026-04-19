/**
 * Document workflow telemetry — [deal-room:documents] prefix; never throws.
 */

const PREFIX = "[deal-room:documents]";

function log(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

const c = {
  requirementsCreated: 0,
  attachmentsAdded: 0,
  approvals: 0,
  rejections: 0,
  missingRequiredSnapshots: 0,
};

export function recordDocumentRequirementCreated(): void {
  try {
    c.requirementsCreated += 1;
    log(`requirement_created total=${c.requirementsCreated}`);
  } catch {
    /* ignore */
  }
}

export function recordDocumentAttachmentAdded(): void {
  try {
    c.attachmentsAdded += 1;
    log(`attachment_added total=${c.attachmentsAdded}`);
  } catch {
    /* ignore */
  }
}

export function recordDocumentRequirementApproved(): void {
  try {
    c.approvals += 1;
    log(`approved total=${c.approvals}`);
  } catch {
    /* ignore */
  }
}

export function recordDocumentRequirementRejected(): void {
  try {
    c.rejections += 1;
    log(`rejected total=${c.rejections}`);
  } catch {
    /* ignore */
  }
}

/** Snapshots operator-visible missing-required counts (call when computing packet summary if useful). */
export function recordMissingRequiredSnapshot(count: number): void {
  try {
    c.missingRequiredSnapshots += 1;
    log(`missing_required_snapshot count=${count} snapshots=${c.missingRequiredSnapshots}`);
  } catch {
    /* ignore */
  }
}

export function getDealRoomDocumentMonitoringSnapshot(): Readonly<typeof c> {
  return { ...c };
}

export function resetDealRoomDocumentMonitoringForTests(): void {
  try {
    c.requirementsCreated = 0;
    c.attachmentsAdded = 0;
    c.approvals = 0;
    c.rejections = 0;
    c.missingRequiredSnapshots = 0;
  } catch {
    /* ignore */
  }
}
