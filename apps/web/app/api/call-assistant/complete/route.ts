import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildCallAssistantNotes } from "@/modules/call-assistant/call-assistant-learning.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import {
  addAcquisitionNote,
  moveAcquisitionToNextStage,
  setAcquisitionLost,
} from "@/modules/acquisition/acquisition.service";
import { notifyAcquisitionAdmins } from "@/modules/acquisition/acquisition-notifications.service";
import { logSalesCall } from "@/modules/sales-scripts/sales-script-tracking.service";
import type {
  SalesCallOutcome,
  SalesScriptCategory,
  ScriptAudience,
} from "@/modules/sales-scripts/sales-script.types";

export const dynamic = "force-dynamic";

const OUTCOMES = new Set<SalesCallOutcome>(["INTERESTED", "DEMO", "CLOSED", "LOST", "NO_ANSWER"]);

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    contactId?: string | null;
    audience?: ScriptAudience;
    scriptCategory?: SalesScriptCategory;
    variantKey?: string;
    outcome?: SalesCallOutcome;
    objectionsEncountered?: string[];
    notes?: string | null;
    stagesVisited?: CallStage[];
    secondsInCallApprox?: number;
    suggestionMeta?: { stage: CallStage; usedAlternativeIndex?: number }[];
    nextActionNote?: string | null;
    /** If true, move acquisition contact one pipeline step. If false, never advance. If omitted, advance when outcome is DEMO. */
    pipelineAdvance?: boolean;
    /** If set, record an admin notification for follow-up (no cron). */
    followUpAtIso?: string | null;
    /** Call intelligence: abridged transcript for CRM / call log (no raw audio). */
    fullTranscript?: string | null;
    /** Stringified heuristic analysis (small JSON). */
    intelAnalysisJson?: string | null;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const audience = body.audience;
  const scriptCategory = body.scriptCategory;
  const outcome = body.outcome;

  if (audience !== "BROKER" && audience !== "INVESTOR") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }
  if (!scriptCategory?.trim()) {
    return NextResponse.json({ error: "script_category_required" }, { status: 400 });
  }
  if (!outcome || !OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "invalid_outcome" }, { status: 400 });
  }

  const stagesVisited = Array.isArray(body.stagesVisited) ? body.stagesVisited : [];
  const objectionsEncountered = Array.isArray(body.objectionsEncountered)
    ? body.objectionsEncountered.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  const transcriptNote = body.fullTranscript?.trim()
    ? `Transcript (abridged):\n${body.fullTranscript.trim().slice(0, 5000)}`
    : "";
  const intelNote = body.intelAnalysisJson?.trim()
    ? `Intel (heuristic): ${body.intelAnalysisJson.trim().slice(0, 2000)}`
    : "";

  const userNotes = [
    body.notes?.trim() ?? "",
    body.nextActionNote?.trim() ? `Next: ${body.nextActionNote.trim()}` : "",
    transcriptNote,
    intelNote,
  ]
    .filter(Boolean)
    .join("\n\n");

  const notesWithLearning = buildCallAssistantNotes(userNotes, {
    outcome,
    stagesVisited,
    secondsInCallApprox: typeof body.secondsInCallApprox === "number" ? body.secondsInCallApprox : 0,
    objectionLabels: objectionsEncountered,
    suggestionMeta: Array.isArray(body.suggestionMeta) ? body.suggestionMeta : [],
  });

  try {
    const row = await logSalesCall({
      contactId: body.contactId ?? null,
      audience,
      scriptCategory,
      variantKey: typeof body.variantKey === "string" ? body.variantKey : "default",
      outcome,
      objectionsEncountered: objectionsEncountered.length > 0 ? objectionsEncountered : undefined,
      notes: notesWithLearning,
      performedByUserId: auth.userId,
    });

    const contactId = body.contactId?.trim();
    if (contactId) {
      const crmParts = [
        userNotes.trim() || null,
        `Call assistant · ${outcome}`,
        body.nextActionNote?.trim() ? `Next action: ${body.nextActionNote.trim()}` : null,
      ].filter((x): x is string => Boolean(x));
      if (crmParts.length > 0) {
        await addAcquisitionNote(contactId, crmParts.join("\n\n").slice(0, 7900), auth.userId ?? null);
      }

      if (outcome === "LOST") {
        await setAcquisitionLost(contactId);
      } else {
        const shouldAdvance =
          typeof body.pipelineAdvance === "boolean" ? body.pipelineAdvance : outcome === "DEMO";
        if (shouldAdvance) {
          await moveAcquisitionToNextStage(contactId);
        }
      }
    }

    const followUp = body.followUpAtIso?.trim();
    if (followUp && contactId) {
      await notifyAcquisitionAdmins("call_assistant_followup_scheduled", {
        contactId,
        followUpAtIso: followUp,
        callLogId: row.id,
      });
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "complete_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
