import { prisma } from "@/lib/db";
import { executiveLog } from "./executive-log";

export async function appendMemoryNote(params: {
  agentName: string;
  entityType: string;
  entityId: string;
  noteType: string;
  summary: string;
  payloadJson?: Record<string, unknown>;
  confidenceLevel?: string;
}) {
  const row = await prisma.agentMemoryNote.create({
    data: {
      agentName: params.agentName,
      entityType: params.entityType,
      entityId: params.entityId,
      noteType: params.noteType,
      summary: params.summary.slice(0, 8000),
      payloadJson: params.payloadJson ?? {},
      confidenceLevel: params.confidenceLevel ?? null,
    },
  });
  executiveLog.memory("note_added", { id: row.id });
  return row.id;
}
