/**
 * Collaboration telemetry — prefix [collaboration]; never throws.
 */

const PREFIX = "[collaboration]";

let meetingsCreated = 0;
let notesAdded = 0;

function log(line: string): void {
  try {
    console.info(`${PREFIX} ${line}`);
  } catch {
    /* ignore */
  }
}

export function recordCollaborationMeetingCreated(kind: string): void {
  try {
    meetingsCreated += 1;
    log(`meeting_created kind=${kind} total_meetings=${meetingsCreated}`);
  } catch {
    /* ignore */
  }
}

export function recordCollaborationNoteAdded(): void {
  try {
    notesAdded += 1;
    log(`note_added total_notes=${notesAdded}`);
  } catch {
    /* ignore */
  }
}

export function getCollaborationMonitoringSnapshot(): { meetingsCreated: number; notesAdded: number } {
  return { meetingsCreated, notesAdded };
}

export function resetCollaborationMonitoringForTests(): void {
  try {
    meetingsCreated = 0;
    notesAdded = 0;
  } catch {
    /* ignore */
  }
}
