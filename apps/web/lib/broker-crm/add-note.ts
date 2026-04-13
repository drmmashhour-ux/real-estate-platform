import { prisma } from "@/lib/db";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";

export async function addBrokerCrmNote(leadId: string, brokerUserId: string, body: string) {
  const note = await prisma.lecipmBrokerCrmLeadNote.create({
    data: { leadId, brokerUserId, body },
  });
  trackBrokerCrm("broker_crm_note_added", { leadId, noteId: note.id }, { userId: brokerUserId });
  return note;
}
