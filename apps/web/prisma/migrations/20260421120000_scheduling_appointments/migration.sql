-- Scheduling: availability rules, exceptions, appointments, events

CREATE TYPE "AppointmentType" AS ENUM (
  'PROPERTY_VISIT',
  'CALL',
  'MEETING',
  'CONSULTATION',
  'DOCUMENT_REVIEW',
  'OFFER_DISCUSSION',
  'CONTRACT_SIGNING'
);

CREATE TYPE "AppointmentStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'RESCHEDULE_REQUESTED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
);

CREATE TYPE "MeetingMode" AS ENUM (
  'IN_PERSON',
  'PHONE',
  'VIDEO'
);

CREATE TYPE "AppointmentEventType" AS ENUM (
  'REQUESTED',
  'CONFIRMED',
  'RESCHEDULED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
  'NOTE_ADDED',
  'STATUS_CHANGED'
);

CREATE TABLE "availability_rules" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "availability_exceptions" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "client_user_id" TEXT,
    "broker_client_id" TEXT,
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "meeting_mode" "MeetingMode" NOT NULL DEFAULT 'IN_PERSON',
    "requested_by_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "reschedule_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointment_events" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "AppointmentEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "availability_rules_broker_id_idx" ON "availability_rules"("broker_id");
CREATE INDEX "availability_rules_day_of_week_idx" ON "availability_rules"("day_of_week");

CREATE INDEX "availability_exceptions_broker_id_idx" ON "availability_exceptions"("broker_id");
CREATE INDEX "availability_exceptions_starts_at_idx" ON "availability_exceptions"("starts_at");

CREATE INDEX "appointments_broker_id_idx" ON "appointments"("broker_id");
CREATE INDEX "appointments_client_user_id_idx" ON "appointments"("client_user_id");
CREATE INDEX "appointments_broker_client_id_idx" ON "appointments"("broker_client_id");
CREATE INDEX "appointments_listing_id_idx" ON "appointments"("listing_id");
CREATE INDEX "appointments_offer_id_idx" ON "appointments"("offer_id");
CREATE INDEX "appointments_contract_id_idx" ON "appointments"("contract_id");
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

CREATE INDEX "appointment_events_appointment_id_idx" ON "appointment_events"("appointment_id");
