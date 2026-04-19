/**
 * Client portal telemetry — [deal-room:portal] prefix; never throws.
 */

const PREFIX = "[deal-room:portal]";

function log(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

const c = {
  portalEnabled: 0,
  portalRevoked: 0,
  portalPageViews: 0,
  portalDocumentUploads: 0,
  portalParticipantActions: 0,
  portalDenied: 0,
};

export function recordPortalAccessEnabled(): void {
  try {
    c.portalEnabled += 1;
    log(`access_enabled total=${c.portalEnabled}`);
  } catch {
    /* ignore */
  }
}

export function recordPortalAccessRevoked(): void {
  try {
    c.portalRevoked += 1;
    log(`access_revoked total=${c.portalRevoked}`);
  } catch {
    /* ignore */
  }
}

export function recordPortalPageView(): void {
  try {
    c.portalPageViews += 1;
    log(`page_view total=${c.portalPageViews}`);
  } catch {
    /* ignore */
  }
}

export function recordPortalDocumentUpload(): void {
  try {
    c.portalDocumentUploads += 1;
    log(`document_upload total=${c.portalDocumentUploads}`);
  } catch {
    /* ignore */
  }
}

export function recordPortalParticipantAction(action: string): void {
  try {
    c.portalParticipantActions += 1;
    log(`participant_action action=${action} total=${c.portalParticipantActions}`);
  } catch {
    /* ignore */
  }
}

export function recordPortalAccessDenied(reason: string): void {
  try {
    c.portalDenied += 1;
    log(`access_denied reason=${reason} total=${c.portalDenied}`);
  } catch {
    /* ignore */
  }
}

export function getDealRoomPortalMonitoringSnapshot(): Readonly<typeof c> {
  return { ...c };
}

export function resetDealRoomPortalMonitoringForTests(): void {
  try {
    c.portalEnabled = 0;
    c.portalRevoked = 0;
    c.portalPageViews = 0;
    c.portalDocumentUploads = 0;
    c.portalParticipantActions = 0;
    c.portalDenied = 0;
  } catch {
    /* ignore */
  }
}
