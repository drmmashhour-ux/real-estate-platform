/** Appointments — mirrors Prisma enums for scheduling UI. */

export type AppointmentType =
  | "PROPERTY_VISIT"
  | "CALL"
  | "MEETING"
  | "CONSULTATION"
  | "DOCUMENT_REVIEW"
  | "OFFER_DISCUSSION"
  | "CONTRACT_SIGNING";

export type MeetingMode = "IN_PERSON" | "PHONE" | "VIDEO";

export type AppointmentEventType =
  | "REQUESTED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "NOTE_ADDED"
  | "STATUS_CHANGED";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULE_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

/** Appointment event audit row shape for timelines. */
export type AppointmentEventView = {
  id: string;
  type: AppointmentEventType;
  message?: string | null;
  createdAt: Date | string;
};
