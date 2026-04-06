import { expect, type Page } from "@playwright/test";
import { prisma } from "../../lib/db";
import type { BookingStatus, ManualPaymentSettlement } from "@prisma/client";
import { e2eAssertionPassed } from "./logger";

export async function assertBookingStatus(
  bookingId: string,
  expected: BookingStatus,
  label = "assertBookingStatus",
): Promise<void> {
  const row = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  });
  if (row?.status !== expected) {
    throw new Error(`${label}: booking ${bookingId} expected ${expected}, got ${row?.status ?? "null"}`);
  }
  e2eAssertionPassed(label, { bookingId, status: expected });
}

export async function assertManualPaymentSettlement(
  bookingId: string,
  expected: ManualPaymentSettlement,
  label = "assertManualPaymentSettlement",
): Promise<void> {
  const row = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { manualPaymentSettlement: true },
  });
  if (row?.manualPaymentSettlement !== expected) {
    throw new Error(
      `${label}: booking ${bookingId} expected manual ${expected}, got ${row?.manualPaymentSettlement ?? "null"}`,
    );
  }
  e2eAssertionPassed(label, { bookingId, manualPaymentSettlement: expected });
}

export async function assertPaymentStatusForBooking(
  bookingId: string,
  expected: string,
  label = "assertPaymentStatusForBooking",
): Promise<void> {
  const pay = await prisma.payment.findFirst({
    where: { bookingId },
    select: { status: true },
  });
  if (pay?.status !== expected) {
    throw new Error(`${label}: payment for ${bookingId} expected ${expected}, got ${pay?.status ?? "null"}`);
  }
  e2eAssertionPassed(label, { bookingId, paymentStatus: expected });
}

export async function assertLocaleHtml(page: Page, expectedLang: string, label = "assertLocaleHtml"): Promise<void> {
  const lang = await page.locator("html").getAttribute("lang");
  if (!lang || !lang.toLowerCase().startsWith(expectedLang.toLowerCase())) {
    throw new Error(`${label}: expected html lang starting with ${expectedLang}, got ${lang}`);
  }
  e2eAssertionPassed(label, { lang });
}

export async function assertRTL(page: Page, label = "assertRTL"): Promise<void> {
  const dir = await page.locator("html").getAttribute("dir");
  if (dir !== "rtl") {
    throw new Error(`${label}: expected dir=rtl, got ${dir}`);
  }
  e2eAssertionPassed(label, { dir: "rtl" });
}

export type ConsoleCollector = { errors: string[]; dispose: () => void };

/** Collects `console` type errors from the page for soft checks. */
export function attachConsoleErrorCollector(page: Page): ConsoleCollector {
  const errors: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", handler);
  return {
    errors,
    dispose: () => page.off("console", handler),
  };
}

export async function assertNoConsoleErrors(collector: ConsoleCollector, label = "assertNoConsoleErrors"): Promise<void> {
  collector.dispose();
  const critical = collector.errors.filter((t) => /uncaught|failed to load|net::err/i.test(t));
  if (critical.length > 0) {
    throw new Error(`${label}: console errors: ${critical.slice(0, 5).join(" | ")}`);
  }
  e2eAssertionPassed(label, { checked: collector.errors.length });
}

/** Playwright expect helper for visible success regions. */
export async function expectBodyVisible(page: Page): Promise<void> {
  await expect(page.locator("body")).toBeVisible();
  e2eAssertionPassed("body_visible");
}
