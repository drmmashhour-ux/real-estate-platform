import { NextRequest, NextResponse } from "next/server";
import type { AppointmentType, MeetingMode } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { createAppointmentEvent } from "@/modules/scheduling/services/appointment-helpers";
import { notifyAppointmentRequested } from "@/modules/scheduling/services/appointment-notifications";
import {
  appointmentOverlaps,
  isValidAppointmentRange,
  isWithinAvailability,
} from "@/modules/scheduling/services/scheduling-rules";
import { canBookForBroker } from "@/modules/scheduling/services/appointment-permissions";
import { onAppointmentRequested } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

const TYPES: AppointmentType[] = [
  "PROPERTY_VISIT",
  "CALL",
  "MEETING",
  "CONSULTATION",
  "DOCUMENT_REVIEW",
  "OFFER_DISCUSSION",
  "CONTRACT_SIGNING",
];

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const brokerId = typeof body.brokerId === "string" ? body.brokerId.trim() : "";
  if (!brokerId) return NextResponse.json({ error: "brokerId required" }, { status: 400 });
  if (!canBookForBroker(user, brokerId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { id: true, role: true },
  });
  if (!broker || broker.role !== "BROKER") {
    return NextResponse.json({ error: "Invalid broker" }, { status: 400 });
  }

  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
  const endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "startsAt and endsAt required" }, { status: 400 });
  }
  if (!isValidAppointmentRange(startsAt, endsAt)) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const type = String(body.type ?? "").toUpperCase() as AppointmentType;
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Invalid appointment type" }, { status: 400 });

  let meetingMode: MeetingMode = "IN_PERSON";
  if (typeof body.meetingMode === "string") {
    const m = body.meetingMode.toUpperCase();
    if (m === "PHONE" || m === "VIDEO" || m === "IN_PERSON") meetingMode = m as MeetingMode;
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || null : null;
  const offerId = typeof body.offerId === "string" ? body.offerId.trim() || null : null;
  const contractId = typeof body.contractId === "string" ? body.contractId.trim() || null : null;
  const brokerClientId = typeof body.brokerClientId === "string" ? body.brokerClientId.trim() || null : null;

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing || listing.ownerId !== brokerId) {
      return NextResponse.json({ error: "Listing does not match broker" }, { status: 400 });
    }
  }

  if (offerId) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: { buyerId: true, brokerId: true },
    });
    if (!offer || offer.buyerId !== userId) {
      return NextResponse.json({ error: "Offer does not belong to you" }, { status: 400 });
    }
    if (offer.brokerId && offer.brokerId !== brokerId) {
      return NextResponse.json({ error: "Offer broker mismatch" }, { status: 400 });
    }
  }

  if (contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { userId: true },
    });
    if (!contract || contract.userId !== userId) {
      return NextResponse.json({ error: "Contract does not belong to you" }, { status: 400 });
    }
  }

  if (brokerClientId) {
    const bc = await prisma.brokerClient.findUnique({
      where: { id: brokerClientId },
      select: { brokerId: true, userId: true },
    });
    if (!bc || bc.brokerId !== brokerId) {
      return NextResponse.json({ error: "CRM client does not match broker" }, { status: 400 });
    }
    if (bc.userId && bc.userId !== userId) {
      return NextResponse.json({ error: "CRM client is linked to another user" }, { status: 400 });
    }
  }

  const [rules, exceptions, existing] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { brokerId, isActive: true } }),
    prisma.availabilityException.findMany({
      where: {
        brokerId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    }),
    prisma.appointment.findMany({
      where: {
        brokerId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"] },
      },
      select: { startsAt: true, endsAt: true, status: true },
    }),
  ]);

  if (
    !isWithinAvailability(
      rules.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startMinute: r.startMinute,
        endMinute: r.endMinute,
        isActive: r.isActive,
      })),
      exceptions.map((e) => ({
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        isAvailable: e.isAvailable,
      })),
      startsAt,
      endsAt,
      null
    )
  ) {
    return NextResponse.json({ error: "Time is outside broker availability" }, { status: 400 });
  }

  if (appointmentOverlaps(existing, startsAt, endsAt)) {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : `${type.replace(/_/g, " ")}`;
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 10000) || null : null;
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 500) || null : null;
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() || null : null;

  const appt = await prisma.appointment.create({
    data: {
      brokerId,
      clientUserId: userId,
      brokerClientId,
      listingId,
      offerId,
      contractId,
      type,
      status: "PENDING",
      title,
      description,
      location,
      startsAt,
      endsAt,
      timezone,
      meetingMode,
      requestedById: userId,
    },
  });

  await createAppointmentEvent(appt.id, "REQUESTED", userId, "Appointment requested", {
    type,
  });

  notifyAppointmentRequested(appt);

  void trackDemoEvent(
    DemoEvents.APPOINTMENT_REQUESTED,
    { appointmentType: type, listingId: listingId ?? undefined },
    userId
  );
  if (type === "PROPERTY_VISIT" && listingId) {
    void trackDemoEvent(DemoEvents.PROPERTY_VISIT_BOOKED, { listingId }, userId);
  }

  void onAppointmentRequested({
    appointmentId: appt.id,
    brokerUserId: brokerId,
    title: appt.title ?? undefined,
  });

  return NextResponse.json({ ok: true, appointment: appt });
}
