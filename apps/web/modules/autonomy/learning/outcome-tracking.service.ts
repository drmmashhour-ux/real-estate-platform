import type { OutcomeEvent } from "../types/autonomy.types";
import { logAutonomy } from "../lib/autonomy-log";

const inMemoryOutcomeEvents: OutcomeEvent[] = [];

export function recordOutcomeEvent(event: OutcomeEvent): OutcomeEvent {
  inMemoryOutcomeEvents.push(event);
  logAutonomy("[autonomy:outcome:recorded]", { actionId: event.actionId, metric: event.metric });
  return event;
}

export function listOutcomeEvents(): OutcomeEvent[] {
  return [...inMemoryOutcomeEvents];
}

export function resetOutcomeEventsForTests(): void {
  inMemoryOutcomeEvents.length = 0;
}
