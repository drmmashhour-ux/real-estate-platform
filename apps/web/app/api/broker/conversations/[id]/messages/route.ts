import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";

export const dynamic = "force-dynamic";

/** GET: list messages in a conversation (broker must be participant). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: conversationId } = await params;
  const conv = await prisma.brokerConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ broker1Id: brokerId }, { broker2Id: brokerId }],
    },
  });
  if (!conv) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
  const messages = await prisma.brokerConversationMessage.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(messages);
}

/** POST: send a message. Body: { body }. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const senderId = await getGuestId();
  if (!senderId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: conversationId } = await params;
  const conv = await prisma.brokerConversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ broker1Id: senderId }, { broker2Id: senderId }],
    },
  });
  if (!conv) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const text = body.body ?? body.message ?? "";
  if (!text.trim()) {
    return Response.json({ error: "Message body required" }, { status: 400 });
  }
  const priorSent = await prisma.brokerConversationMessage.count({ where: { senderId } });
  if (priorSent === 0) {
    const licenseBlock = await requireContentLicenseAccepted(senderId);
    if (licenseBlock) return licenseBlock;
  }
  const message = await prisma.brokerConversationMessage.create({
    data: { conversationId, senderId, body: text.trim() },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  await prisma.brokerConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return Response.json(message);
}
