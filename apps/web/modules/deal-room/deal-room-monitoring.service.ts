/**
 * Deal room telemetry — [deal-room] prefix; never throws.
 */

const PREFIX = "[deal-room]";

const c = {
  roomsCreated: 0,
  participantsAdded: 0,
  notesAdded: 0,
  tasksCreated: 0,
  tasksCompleted: 0,
  meetingsCreated: 0,
  documentsAdded: 0,
  roomsClosed: 0,
};

function log(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomCreated(): void {
  try {
    c.roomsCreated += 1;
    log(`room_created total=${c.roomsCreated}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomParticipantAdded(): void {
  try {
    c.participantsAdded += 1;
    log(`participant_added total=${c.participantsAdded}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomNoteAdded(): void {
  try {
    c.notesAdded += 1;
    log(`note_added total=${c.notesAdded}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomTaskCreated(): void {
  try {
    c.tasksCreated += 1;
    log(`task_created total=${c.tasksCreated}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomTaskCompleted(): void {
  try {
    c.tasksCompleted += 1;
    log(`task_completed total=${c.tasksCompleted}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomMeetingCreated(): void {
  try {
    c.meetingsCreated += 1;
    log(`meeting_created total=${c.meetingsCreated}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomDocumentAdded(): void {
  try {
    c.documentsAdded += 1;
    log(`document_added total=${c.documentsAdded}`);
  } catch {
    /* ignore */
  }
}

export function recordDealRoomClosed(): void {
  try {
    c.roomsClosed += 1;
    log(`room_closed total=${c.roomsClosed}`);
  } catch {
    /* ignore */
  }
}

export function getDealRoomMonitoringSnapshot(): Readonly<typeof c> {
  return { ...c };
}

export function resetDealRoomMonitoringForTests(): void {
  try {
    c.roomsCreated = 0;
    c.participantsAdded = 0;
    c.notesAdded = 0;
    c.tasksCreated = 0;
    c.tasksCompleted = 0;
    c.meetingsCreated = 0;
    c.documentsAdded = 0;
    c.roomsClosed = 0;
  } catch {
    /* ignore */
  }
}
