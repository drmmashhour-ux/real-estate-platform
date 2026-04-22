import { describe, expect, it } from "vitest";

import {
  billingNotificationTriggers,
  classifyOverdueStatus,
  DEFAULT_BILLING_RULES,
  proratePartialMonth,
  shouldSuspendService,
} from "../soins-billing-rules.service";

describe("proratePartialMonth", () => {
  it("prorates by inclusive calendar days when service starts mid-period", () => {
    const periodStart = new Date("2024-01-01T12:00:00.000Z");
    const periodEnd = new Date("2024-01-31T12:00:00.000Z");
    const serviceStart = new Date("2024-01-15T12:00:00.000Z");

    const { billableFraction, proratedAmount } = proratePartialMonth({
      monthlyAmount: 3100,
      periodStart,
      periodEnd,
      serviceStart,
    });

    expect(billableFraction).toBeCloseTo(17 / 31, 6);
    expect(proratedAmount).toBe(Math.round((3100 * (17 / 31)) * 100) / 100);
  });

  it("returns zero when service starts after period end", () => {
    const r = proratePartialMonth({
      monthlyAmount: 1000,
      periodStart: new Date("2024-01-01T00:00:00.000Z"),
      periodEnd: new Date("2024-01-15T00:00:00.000Z"),
      serviceStart: new Date("2024-02-01T00:00:00.000Z"),
    });
    expect(r.billableFraction).toBe(0);
    expect(r.proratedAmount).toBe(0);
  });

  it("full month when service starts at period start", () => {
    const start = new Date("2024-03-01T00:00:00.000Z");
    const end = new Date("2024-03-31T00:00:00.000Z");
    const r = proratePartialMonth({
      monthlyAmount: 3000,
      periodStart: start,
      periodEnd: end,
      serviceStart: start,
    });
    expect(r.billableFraction).toBe(1);
    expect(r.proratedAmount).toBe(3000);
  });
});

describe("classifyOverdueStatus", () => {
  const rules = DEFAULT_BILLING_RULES;

  it("returns CURRENT when payment is recorded regardless of lateness", () => {
    const status = classifyOverdueStatus(
      {
        dueDate: new Date("2024-01-01"),
        paidDate: new Date("2024-01-10"),
        now: new Date("2024-01-12"),
        status: "CURRENT",
      },
      rules,
    );
    expect(status).toBe("CURRENT");
  });

  it("returns GRACE within grace period after due with no payment", () => {
    const due = new Date("2024-01-01");
    const now = new Date("2024-01-03");
    const status = classifyOverdueStatus(
      {
        dueDate: due,
        paidDate: null,
        now,
        status: "CURRENT",
      },
      rules,
    );
    expect(status).toBe("GRACE");
  });

  it("returns OVERDUE after grace but before suspend threshold", () => {
    const due = new Date("2024-01-01");
    const now = new Date("2024-01-15");
    const status = classifyOverdueStatus(
      {
        dueDate: due,
        paidDate: null,
        now,
        status: "CURRENT",
      },
      rules,
    );
    expect(status).toBe("OVERDUE");
  });

  it("returns SUSPENDED when past suspend threshold", () => {
    const due = new Date("2024-01-01");
    const now = new Date("2024-02-01");
    const status = classifyOverdueStatus(
      {
        dueDate: due,
        paidDate: null,
        now,
        status: "CURRENT",
      },
      rules,
    );
    expect(status).toBe("SUSPENDED");
  });
});

describe("billingNotificationTriggers", () => {
  it("emits PAYMENT_DUE_SOON within remind window", () => {
    const t = billingNotificationTriggers({
      status: "CURRENT",
      daysUntilDue: 2,
      daysPastDue: null,
      addOnChanged: false,
      rules: DEFAULT_BILLING_RULES,
    });
    expect(t).toContain("PAYMENT_DUE_SOON");
  });

  it("emits OVERDUE and SERVICE_SUSPENDED when suspended", () => {
    const t = billingNotificationTriggers({
      status: "SUSPENDED",
      daysUntilDue: null,
      daysPastDue: 25,
      addOnChanged: false,
      rules: DEFAULT_BILLING_RULES,
    });
    expect(t).toContain("OVERDUE");
    expect(t).toContain("SERVICE_SUSPENDED");
  });

  it("includes ADD_ON_CHANGED when add-on changed", () => {
    const t = billingNotificationTriggers({
      status: "CURRENT",
      daysUntilDue: 10,
      daysPastDue: null,
      addOnChanged: true,
      rules: DEFAULT_BILLING_RULES,
    });
    expect(t).toContain("ADD_ON_CHANGED");
  });
});

describe("shouldSuspendService", () => {
  it("true when days past due meets policy", () => {
    expect(shouldSuspendService(21, DEFAULT_BILLING_RULES)).toBe(true);
    expect(shouldSuspendService(20, DEFAULT_BILLING_RULES)).toBe(false);
  });
});
