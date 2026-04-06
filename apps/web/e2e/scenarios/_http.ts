import type { APIRequestContext } from "@playwright/test";
import { getOrigin } from "./_context";

export async function postJson(ctx: APIRequestContext, path: string, data: object) {
  const base = getOrigin();
  return ctx.post(`${base}${path}`, {
    data,
    headers: { "Content-Type": "application/json" },
  });
}

export function bnhubBookingDates(offsetDays: number): { startDate: string; endDate: string } {
  const checkIn = new Date();
  checkIn.setUTCDate(checkIn.getUTCDate() + offsetDays);
  checkIn.setUTCHours(12, 0, 0, 0);
  const checkOut = new Date(checkIn);
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);
  return { startDate: checkIn.toISOString(), endDate: checkOut.toISOString() };
}
