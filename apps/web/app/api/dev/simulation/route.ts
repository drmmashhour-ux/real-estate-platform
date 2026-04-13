/**
 * Dev-only: simulation status and run seed.
 * GET  – returns what the simulation includes and how to run it
 * POST – runs the seed script (development only)
 */

import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import { isProductionEnv } from "@/lib/runtime-env";

const isDev = process.env.NODE_ENV === "development";

export async function GET() {
  if (isProductionEnv()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const payload = {
    simulation: true,
    description: "Realistic seed data for all platform sections",
    run: "npm run seed or npx prisma db seed (from apps/web)",
    sections: [
      "Users (guest, hosts, broker, ambassador, investor)",
      "BNHUB: listings, bookings (confirmed/completed/pending/disputed), payments, review, dispute",
      "Projects: 2 projects, units, subscription, favorites, alerts, reservations",
      "Leads (project context)",
      "Referrals: program, code DEMO-REF-001, ambassador, commission",
      "Real estate transaction: offer, timeline, steps",
      "Trust & Safety: incidents (under review, resolved)",
      "Billing: Host Pro plan, subscription, invoice",
    ],
    demoAccounts: [
      "guest@demo.com",
      "host@demo.com",
      "host2@demo.com",
      "broker@demo.com",
      "ambassador@demo.com",
      "investor@demo.com",
    ],
    docs: "/docs/SIMULATION.md",
  };
  return NextResponse.json(payload);
}

export async function POST() {
  if (!isDev) {
    return NextResponse.json({ error: "Simulation run is only allowed in development" }, { status: 403 });
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set. Add it to .env to run the simulation seed." },
      { status: 400 }
    );
  }
  try {
    const appDir = path.resolve(process.cwd());
    execSync("npx prisma db seed", {
      cwd: appDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    return NextResponse.json({ ok: true, message: "Seed completed successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seed failed";
    const stderr = err && typeof err === "object" && "stderr" in err ? String((err as { stderr?: unknown }).stderr) : undefined;
    return NextResponse.json(
      { ok: false, error: message, details: stderr },
      { status: 500 }
    );
  }
}
