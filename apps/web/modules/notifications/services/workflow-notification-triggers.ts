import { createNotification } from "@/modules/notifications/services/create-notification";
import { createActionQueueItem } from "@/modules/notifications/services/action-queue";
import { priorityRules } from "@/modules/notifications/services/priority-rules";

const messagesUrl = (conversationId: string) =>
  `/dashboard/messages?conversationId=${encodeURIComponent(conversationId)}`;

const offerUrl = (offerId: string) => `/dashboard/offers/${encodeURIComponent(offerId)}`;

const appointmentUrl = (id: string) => `/dashboard/appointments/${encodeURIComponent(id)}`;

const intakeClientUrl = () => "/dashboard/intake";

const intakeBrokerUrl = (brokerClientId: string) =>
  `/dashboard/broker/intake/${encodeURIComponent(brokerClientId)}`;

const contractUrl = (contractId: string) => `/dashboard/contracts?highlight=${encodeURIComponent(contractId)}`;

/** New message in thread — notify recipients + optional respond action. */
export async function onNewMessage(params: {
  recipientUserIds: string[];
  senderId: string;
  conversationId: string;
  preview?: string;
}): Promise<void> {
  for (const uid of params.recipientUserIds) {
    if (uid === params.senderId) continue;
    void createNotification({
      userId: uid,
      type: "MESSAGE",
      title: "New message",
      message: params.preview?.slice(0, 280) ?? "You have a new message.",
      priority: priorityRules.messageUnread,
      actionUrl: messagesUrl(params.conversationId),
      actionLabel: "Open conversation",
      actorId: params.senderId,
      conversationId: params.conversationId,
      skipIfDuplicateUnread: true,
    });
    void createActionQueueItem({
      userId: uid,
      type: "RESPOND_MESSAGE",
      title: "Reply to conversation",
      description: "Unread message may need a response.",
      priority: "NORMAL",
      sourceType: "conversation",
      sourceId: params.conversationId,
      actionUrl: messagesUrl(params.conversationId),
      skipIfDuplicateSource: true,
    });
  }
}

export async function onOfferSubmitted(params: {
  offerId: string;
  listingId: string;
  buyerId: string;
  brokerId: string | null;
}): Promise<void> {
  if (params.brokerId) {
    void createNotification({
      userId: params.brokerId,
      type: "OFFER",
      title: "New offer to review",
      message: "A buyer submitted an offer.",
      priority: priorityRules.offerReviewBroker,
      actionUrl: offerUrl(params.offerId),
      actionLabel: "Review offer",
      actorId: params.buyerId,
      offerId: params.offerId,
      listingId: params.listingId,
    });
    void createActionQueueItem({
      userId: params.brokerId,
      type: "REVIEW_OFFER",
      title: "Review submitted offer",
      sourceType: "offer",
      sourceId: params.offerId,
      actionUrl: offerUrl(params.offerId),
      priority: "HIGH",
      skipIfDuplicateSource: true,
    });
  }
}

export async function onOfferCountered(params: {
  offerId: string;
  listingId: string;
  buyerId: string;
  brokerId: string | null;
}): Promise<void> {
  void createNotification({
    userId: params.buyerId,
    type: "OFFER",
    title: "Counter-offer received",
    message: "The other party sent a counter-offer.",
    priority: priorityRules.counterOfferBuyer,
    actionUrl: offerUrl(params.offerId),
    actionLabel: "View offer",
    actorId: params.brokerId ?? undefined,
    offerId: params.offerId,
    listingId: params.listingId,
  });
  void createActionQueueItem({
    userId: params.buyerId,
    type: "REVIEW_COUNTER_OFFER",
    title: "Respond to counter-offer",
    sourceType: "offer",
    sourceId: params.offerId,
    actionUrl: offerUrl(params.offerId),
    priority: "HIGH",
    skipIfDuplicateSource: true,
  });
}

export async function onOfferAccepted(params: {
  offerId: string;
  buyerId: string;
  brokerId: string | null;
}): Promise<void> {
  void createNotification({
    userId: params.buyerId,
    type: "OFFER",
    title: "Offer accepted",
    message: "Your offer was accepted.",
    priority: "HIGH",
    actionUrl: offerUrl(params.offerId),
    offerId: params.offerId,
  });
  if (params.brokerId) {
    void createNotification({
      userId: params.brokerId,
      type: "OFFER",
      title: "Offer accepted",
      message: "The offer was accepted.",
      priority: "NORMAL",
      actionUrl: offerUrl(params.offerId),
      offerId: params.offerId,
    });
  }
}

export async function onOfferRejected(params: {
  offerId: string;
  buyerId: string;
  brokerId: string | null;
}): Promise<void> {
  void createNotification({
    userId: params.buyerId,
    type: "OFFER",
    title: "Offer declined",
    message: "The offer was not accepted.",
    priority: "NORMAL",
    actionUrl: offerUrl(params.offerId),
    offerId: params.offerId,
  });
}

export async function onContractReadyForSignature(params: {
  contractId: string;
  signerUserId: string;
  title?: string;
}): Promise<void> {
  void createNotification({
    userId: params.signerUserId,
    type: "CONTRACT",
    title: params.title ?? "Contract ready to sign",
    message: "Please review and sign when ready.",
    priority: priorityRules.contractSignatureDue,
    actionUrl: contractUrl(params.contractId),
    actionLabel: "Open contract",
    contractId: params.contractId,
  });
  void createActionQueueItem({
    userId: params.signerUserId,
    type: "SIGN_CONTRACT",
    title: "Sign contract",
    sourceType: "contract",
    sourceId: params.contractId,
    actionUrl: contractUrl(params.contractId),
    priority: "URGENT",
    skipIfDuplicateSource: true,
  });
}

export async function onContractSigned(params: {
  contractId: string;
  notifyUserIds: string[];
  message?: string;
}): Promise<void> {
  for (const uid of params.notifyUserIds) {
    void createNotification({
      userId: uid,
      type: "CONTRACT",
      title: "Contract signed",
      message: params.message ?? "A contract was signed.",
      priority: "NORMAL",
      contractId: params.contractId,
      actionUrl: contractUrl(params.contractId),
    });
  }
}

export async function onAppointmentRequested(params: {
  appointmentId: string;
  brokerUserId: string;
  title?: string;
}): Promise<void> {
  void createNotification({
    userId: params.brokerUserId,
    type: "APPOINTMENT",
    title: "New appointment request",
    message: params.title ?? "A client requested an appointment.",
    priority: priorityRules.appointmentConfirm,
    appointmentId: params.appointmentId,
    actionUrl: appointmentUrl(params.appointmentId),
    actionLabel: "Confirm",
  });
  void createActionQueueItem({
    userId: params.brokerUserId,
    type: "CONFIRM_APPOINTMENT",
    title: "Confirm appointment",
    sourceType: "appointment",
    sourceId: params.appointmentId,
    actionUrl: appointmentUrl(params.appointmentId),
    priority: "HIGH",
    skipIfDuplicateSource: true,
  });
}

export async function onAppointmentConfirmed(params: {
  appointmentId: string;
  participantUserIds: string[];
  title?: string;
}): Promise<void> {
  for (const uid of params.participantUserIds) {
    void createNotification({
      userId: uid,
      type: "APPOINTMENT",
      title: "Appointment confirmed",
      message: params.title ?? "Your appointment was confirmed.",
      priority: "NORMAL",
      appointmentId: params.appointmentId,
      actionUrl: appointmentUrl(params.appointmentId),
    });
  }
}

export async function onAppointmentRescheduledOrCancelled(params: {
  appointmentId: string;
  participantUserIds: string[];
  kind: "rescheduled" | "cancelled";
}): Promise<void> {
  const title =
    params.kind === "cancelled" ? "Appointment cancelled" : "Appointment rescheduled";
  for (const uid of params.participantUserIds) {
    void createNotification({
      userId: uid,
      type: "APPOINTMENT",
      title,
      appointmentId: params.appointmentId,
      actionUrl: appointmentUrl(params.appointmentId),
    });
  }
}

export async function onRequiredDocumentRequested(params: {
  clientUserId: string | null;
  brokerClientId: string;
  requiredDocumentItemId: string;
  title: string;
}): Promise<void> {
  if (!params.clientUserId) return;
  void createNotification({
    userId: params.clientUserId,
    type: "INTAKE",
    title: "Document requested",
    message: params.title,
    priority: "HIGH",
    brokerClientId: params.brokerClientId,
    requiredDocumentItemId: params.requiredDocumentItemId,
    actionUrl: intakeClientUrl(),
    actionLabel: "Upload",
  });
  void createActionQueueItem({
    userId: params.clientUserId,
    type: "UPLOAD_REQUIRED_DOCUMENT",
    title: `Upload: ${params.title}`,
    sourceType: "required_document",
    sourceId: params.requiredDocumentItemId,
    actionUrl: intakeClientUrl(),
    priority: "HIGH",
    skipIfDuplicateSource: true,
  });
}

export async function onRequiredDocumentUploaded(params: {
  brokerUserId: string;
  brokerClientId: string;
  requiredDocumentItemId: string;
  title: string;
}): Promise<void> {
  void createNotification({
    userId: params.brokerUserId,
    type: "INTAKE",
    title: "Document uploaded for review",
    message: params.title,
    priority: priorityRules.documentReview,
    brokerClientId: params.brokerClientId,
    requiredDocumentItemId: params.requiredDocumentItemId,
    actionUrl: intakeBrokerUrl(params.brokerClientId),
  });
  void createActionQueueItem({
    userId: params.brokerUserId,
    type: "REVIEW_DOCUMENT",
    title: `Review: ${params.title}`,
    sourceType: "required_document",
    sourceId: params.requiredDocumentItemId,
    actionUrl: intakeBrokerUrl(params.brokerClientId),
    priority: "HIGH",
    skipIfDuplicateSource: true,
  });
}

export async function onRequiredDocumentRejected(params: {
  clientUserId: string | null;
  brokerClientId: string;
  requiredDocumentItemId: string;
  title: string;
}): Promise<void> {
  if (!params.clientUserId) return;
  void createNotification({
    userId: params.clientUserId,
    type: "INTAKE",
    title: "Document needs update",
    message: params.title,
    priority: "HIGH",
    brokerClientId: params.brokerClientId,
    requiredDocumentItemId: params.requiredDocumentItemId,
    actionUrl: intakeClientUrl(),
  });
}

export async function onIntakeCompleted(params: {
  clientUserId: string | null;
  brokerUserId: string;
  brokerClientId: string;
}): Promise<void> {
  void createNotification({
    userId: params.brokerUserId,
    type: "INTAKE",
    title: "Intake marked complete",
    message: "Client intake checklist is complete.",
    brokerClientId: params.brokerClientId,
    actionUrl: intakeBrokerUrl(params.brokerClientId),
  });
  if (params.clientUserId) {
    void createNotification({
      userId: params.clientUserId,
      type: "INTAKE",
      title: "Intake complete",
      message: "Your broker marked your intake complete.",
      brokerClientId: params.brokerClientId,
      actionUrl: intakeClientUrl(),
    });
  }
}

export async function onBrokerFollowUpDue(params: {
  brokerUserId: string;
  brokerClientId: string;
  clientName: string;
  dueAt?: Date | null;
}): Promise<void> {
  void createActionQueueItem({
    userId: params.brokerUserId,
    type: "FOLLOW_UP_CLIENT",
    title: `Follow up: ${params.clientName}`,
    description: "CRM follow-up is due.",
    sourceType: "broker_client",
    sourceId: params.brokerClientId,
    actionUrl: `/dashboard/broker/clients/${encodeURIComponent(params.brokerClientId)}`,
    dueAt: params.dueAt ?? undefined,
    priority: "NORMAL",
    skipIfDuplicateSource: false,
  });
}

export async function onDocumentShared(params: {
  recipientUserId: string;
  documentFileId: string;
  title?: string;
}): Promise<void> {
  void createNotification({
    userId: params.recipientUserId,
    type: "DOCUMENT",
    title: params.title ?? "Document shared with you",
    priority: "NORMAL",
    documentFileId: params.documentFileId,
    actionUrl: `/dashboard/documents?fileId=${encodeURIComponent(params.documentFileId)}`,
    actionLabel: "View",
  });
}
