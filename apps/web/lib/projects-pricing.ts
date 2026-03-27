/**
 * Project monetization pricing. Admin can override via DB (ProjectPricingConfig) or env.
 */

import { prisma } from "@/lib/db";

const TRIAL_DAYS = 30;
const DEFAULT_SUBSCRIPTION_CENTS = 4900;
const DEFAULT_SUBSCRIPTION_PREMIUM_CENTS = 9900;
const DEFAULT_PREMIUM_ONETIME_CENTS = 19900;
const DEFAULT_LEAD_PRICE_CENTS = 1999;

export function getTrialDays(): number {
  return Number(process.env.PROJECT_TRIAL_DAYS) || TRIAL_DAYS;
}

async function getConfig(key: string): Promise<string | null> {
  try {
    const row = await prisma.projectPricingConfig.findUnique({
      where: { key },
    });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSubscriptionPriceCentsAsync(): Promise<number> {
  const v = await getConfig("subscription_price_cents");
  if (v != null && !Number.isNaN(Number(v))) return Number(v);
  return Number(process.env.PROJECT_SUBSCRIPTION_PRICE_CENTS) || DEFAULT_SUBSCRIPTION_CENTS;
}

export async function getSubscriptionPremiumPriceCentsAsync(): Promise<number> {
  const v = await getConfig("subscription_premium_cents");
  if (v != null && !Number.isNaN(Number(v))) return Number(v);
  return Number(process.env.PROJECT_SUBSCRIPTION_PREMIUM_CENTS) || DEFAULT_SUBSCRIPTION_PREMIUM_CENTS;
}

export async function getPremiumOneTimeCentsAsync(): Promise<number> {
  const v = await getConfig("premium_onetime_cents");
  if (v != null && !Number.isNaN(Number(v))) return Number(v);
  return Number(process.env.PROJECT_PREMIUM_ONETIME_CENTS) || DEFAULT_PREMIUM_ONETIME_CENTS;
}

export async function getLeadPriceCentsAsync(): Promise<number> {
  const v = await getConfig("lead_price_cents");
  if (v != null && !Number.isNaN(Number(v))) return Number(v);
  return Number(process.env.PROJECT_LEAD_PRICE_CENTS) || DEFAULT_LEAD_PRICE_CENTS;
}

export function getSubscriptionPriceCents(): number {
  return Number(process.env.PROJECT_SUBSCRIPTION_PRICE_CENTS) || DEFAULT_SUBSCRIPTION_CENTS;
}

export function getSubscriptionPremiumPriceCents(): number {
  return Number(process.env.PROJECT_SUBSCRIPTION_PREMIUM_CENTS) || DEFAULT_SUBSCRIPTION_PREMIUM_CENTS;
}

export function getPremiumOneTimeCents(): number {
  return Number(process.env.PROJECT_PREMIUM_ONETIME_CENTS) || DEFAULT_PREMIUM_ONETIME_CENTS;
}

export function getLeadPriceCents(): number {
  return Number(process.env.PROJECT_LEAD_PRICE_CENTS) || DEFAULT_LEAD_PRICE_CENTS;
}

export function getTrialEndDate(start: Date = new Date()): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + getTrialDays());
  return d;
}
