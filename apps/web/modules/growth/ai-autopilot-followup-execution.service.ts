/**
 * Persists internal follow-up state to `Lead.aiExplanation.aiFollowUp` only — no outbound comms.
 */

import { prisma } from "@/lib/db";
import { aiAutopilotFollowupFlags } from "@/config/feature-flags";
import type { AiFollowUpDecision, AiFollowUpExecutionResult, AiFollowUpState } from "./ai-autopilot-followup.types";
import {
  buildLeadFollowUpDecision,
  leadRowToFollowUpInput,
  type LeadFollowUpInput,
} from "./ai-autopilot-followup.service";
import { mergeAiFollowUpIntoExplanation } from "./ai-autopilot-followup-persist";
import {
  recordFollowUpFailure,
  recordFollowUpRunStarted,
  recordFollowUpRunSummary,
} from "./ai-autopilot-followup-monitoring.service";

const VERSION = "v1";

export type FollowUpLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Date;
  aiScore: number | null;
  aiPriority: string | null;
  aiTags: unknown;
  lastContactedAt: Date | null;
  launchSalesContacted: boolean;
  launchLastContactDate: Date | null;
  pipelineStatus: string;
  aiExplanation: unknown;
};

function decisionToState(d: AiFollowUpDecision): AiFollowUpState {
  return {
    version: VERSION,
    status: d.status,
    nextActionAt: d.nextActionAt,
    followUpPriority: d.followUpPriority,
    reminderReason: d.reminderReason,
    queueScore: d.queueScore,
    updatedAt: d.updatedAt,
  };
}

export async function executeFollowUpWorkflow(rows: FollowUpLeadRow[]): Promise<AiFollowUpExecutionResult> {
  const empty: AiFollowUpExecutionResult = {
    processed: 0,
    written: 0,
    dueNow: 0,
    queued: 0,
    waiting: 0,
    done: 0,
    failures: 0,
  };

  if (!aiAutopilotFollowupFlags.followupV1 || rows.length === 0) {
    return empty;
  }

  const remindersEnabled = aiAutopilotFollowupFlags.followupRemindersV1;
  recordFollowUpRunStarted(rows.length);

  let processed = 0;
  let written = 0;
  let dueNow = 0;
  let queued = 0;
  let waiting = 0;
  let done = 0;
  let failures = 0;
  const topPreview: string[] = [];

  const now = Date.now();

  for (const row of rows) {
    processed += 1;
    let input: LeadFollowUpInput;
    try {
      input = leadRowToFollowUpInput(row);
    } catch {
      failures += 1;
      recordFollowUpFailure(row.id, "map_input");
      continue;
    }

    try {
      const decision = buildLeadFollowUpDecision(input, { remindersEnabled, now });
      const state = decisionToState(decision);

      if (decision.status === "due_now") dueNow += 1;
      else if (decision.status === "queued") queued += 1;
      else if (decision.status === "waiting") waiting += 1;
      else if (decision.status === "done") done += 1;

      if (topPreview.length < 5) {
        topPreview.push(`${row.name}:${decision.status}:${decision.queueScore}`);
      }

      await prisma.lead.update({
        where: { id: row.id },
        data: {
          aiLastUpdated: new Date(now),
          aiExecutionVersion: VERSION,
          aiExplanation: mergeAiFollowUpIntoExplanation(row.aiExplanation, state),
        },
      });
      written += 1;
    } catch (e) {
      failures += 1;
      recordFollowUpFailure(row.id, e instanceof Error ? e.message : "error");
    }
  }

  recordFollowUpRunSummary({
    processed,
    dueNow,
    queued,
    waiting,
    done,
    failures,
    topQueuePreview: topPreview,
  });

  return { processed, written, dueNow, queued, waiting, done, failures };
}
