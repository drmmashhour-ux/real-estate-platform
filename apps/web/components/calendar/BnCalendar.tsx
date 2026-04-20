"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import "@fullcalendar/core/index.css";
import "@fullcalendar/daygrid/index.css";

export type BnCalendarEventInput = {
  id: string;
  title: string;
  start: string;
  end: string;
  /** booking | blocked — blocked nights are not draggable */
  kind?: "booking" | "blocked";
  backgroundColor?: string;
  borderColor?: string;
  editable?: boolean;
  allDay?: boolean;
  /** FullCalendar display mode — `background` for highlight layers */
  display?: "auto" | "background";
  /** Merged into FullCalendar extendedProps (in addition to `kind`). */
  extendedProps?: Record<string, unknown>;
};

function toFcEvents(events: BnCalendarEventInput[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay ?? false,
    backgroundColor: e.backgroundColor,
    borderColor: e.borderColor ?? e.backgroundColor,
    editable: e.kind === "blocked" ? false : e.editable !== false,
    display: e.display === "background" ? ("background" as const) : undefined,
    extendedProps: {
      kind: e.kind ?? "booking",
      ...(e.extendedProps ?? {}),
    },
  }));
}

function dayRangeUtc(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export default function BnCalendar({
  events,
  onDateClick,
  onEventClick,
  onEventDrop,
  skipDateOverlapCheck,
}: {
  events: BnCalendarEventInput[];
  onDateClick?: (dateStr: string) => void;
  onEventClick?: (arg: EventClickArg) => void;
  onEventDrop?: (arg: EventDropArg) => void;
  /** When true, do not block dateClick if another event overlaps (rare). */
  skipDateOverlapCheck?: boolean;
}) {
  const calRef = useRef<FullCalendar>(null);
  const [initialView, setInitialView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");

  useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    setInitialView(w < 768 ? "dayGridWeek" : "dayGridMonth");
  }, []);

  return (
    <FullCalendar
      ref={calRef}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView={initialView}
      events={toFcEvents(events)}
      selectable
      editable
      height="auto"
      eventDisplay="block"
      dayMaxEvents={5}
      dateClick={(info) => {
        if (!onDateClick || skipDateOverlapCheck) {
          onDateClick?.(info.dateStr);
          return;
        }
        const api = calRef.current?.getApi();
        if (!api) {
          onDateClick(info.dateStr);
          return;
        }
        const { start: dayStart, end: dayEnd } = dayRangeUtc(info.date);
        const overlaps = api.getEvents().some((event) => {
          const es = event.start ? new Date(event.start as Date) : null;
          if (!es) return false;
          let ee = event.end ? new Date(event.end as Date) : null;
          if (!ee) {
            ee = event.allDay ? new Date(es.getTime() + 86400000) : new Date(es.getTime() + 3600000);
          }
          return es < dayEnd && ee > dayStart;
        });
        if (overlaps) {
          window.alert("Date is not available — already booked or blocked.");
          return;
        }
        onDateClick(info.dateStr);
      }}
      eventClick={(info) => onEventClick?.(info)}
      eventDrop={(info) => {
        const k = info.event.extendedProps.kind as string | undefined;
        const display = info.event.display;
        if (k === "blocked" || display === "background") {
          info.revert();
          return;
        }
        onEventDrop?.(info);
      }}
    />
  );
}
