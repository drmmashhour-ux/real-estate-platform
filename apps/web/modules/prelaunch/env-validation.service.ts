/**
 * Phase 0 — environment checks with evidence (no fabricated PASS).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EnvCheckItem } from "./final-launch-report.types";

const WANT_NODE_MAJOR = 20;

export function runEnvValidation(): EnvCheckItem[] {
  const items: EnvCheckItem[] = [];

  const node = process.version;
  const major = Number(node.replace(/^v/, "").split(".")[0]);
  const nodeOk = major === WANT_NODE_MAJOR;
  items.push({
    id: "node_version",
    ok: nodeOk,
    severity: nodeOk ? "info" : "warning",
    detail: nodeOk
      ? `Node ${node} matches repo engines (20.x).`
      : `Node ${node} — repo expects 20.x (got major ${major}).`,
    evidence: { version: node, wantedMajor: WANT_NODE_MAJOR },
  });

  const db = (process.env.DATABASE_URL ?? "").trim();
  const dbOk = db.length > 0 && !db.includes("placeholder");
  items.push({
    id: "database_url",
    ok: dbOk,
    severity: dbOk ? "info" : "blocking",
    detail: dbOk ? "DATABASE_URL is set (host redacted)." : "DATABASE_URL missing or empty.",
    evidence: dbOk ? { hostHint: db.split("@")[1]?.split("/")[0] ?? "set" } : {},
  });

  const prismaDotPrisma = join(process.cwd(), "node_modules", ".prisma", "client");
  const prismaPkg = join(process.cwd(), "node_modules", "@prisma", "client");
  const prismaGenerated = existsSync(prismaDotPrisma) || existsSync(prismaPkg);
  items.push({
    id: "prisma_client_generated",
    ok: prismaGenerated,
    severity: prismaGenerated ? "info" : "warning",
    detail: prismaGenerated
      ? "Prisma client present (node_modules/.prisma/client or @prisma/client)."
      : "Prisma client not found — run `pnpm prisma generate` from apps/web.",
    evidence: { checkedDotPrisma: prismaDotPrisma, checkedPackage: prismaPkg },
  });

  const sk = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  const stripeOk = sk.startsWith("sk_test_") || sk.startsWith("sk_live_");
  items.push({
    id: "stripe_secret_key",
    ok: stripeOk,
    severity: stripeOk ? "info" : "blocking",
    detail: stripeOk ? `STRIPE_SECRET_KEY present (${sk.slice(0, 12)}…).` : "STRIPE_SECRET_KEY missing or invalid prefix.",
    evidence: { prefix: sk ? sk.slice(0, 7) : "" },
  });

  const wh = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  const whOk = wh.startsWith("whsec_");
  items.push({
    id: "stripe_webhook_secret",
    ok: whOk,
    severity: whOk ? "info" : "blocking",
    detail: whOk ? "STRIPE_WEBHOOK_SECRET present (whsec_…)." : "STRIPE_WEBHOOK_SECRET missing or invalid.",
  });

  /**
   * Pre-launch policy: growth/launch feature flags should be OFF until explicitly enabled.
   * Security hardening flags default ON in code when unset — reported honestly.
   */
  const growthOff =
    process.env.FEATURE_SOFT_LAUNCH_V1 !== "true" &&
    process.env.FEATURE_SOFT_LAUNCH_V1 !== "1" &&
    process.env.FEATURE_FIRST_USERS_V1 !== "true" &&
    process.env.FEATURE_FIRST_USERS_V1 !== "1" &&
    process.env.FEATURE_ADS_ENGINE_V1 !== "true" &&
    process.env.FEATURE_ADS_ENGINE_V1 !== "1";

  items.push({
    id: "growth_flags_default_off",
    ok: growthOff,
    severity: growthOff ? "info" : "warning",
    detail: growthOff
      ? "Soft-launch / first-users / ads engine env flags are not enabled (good for staged rollout)."
      : "One or more growth flags (FEATURE_SOFT_LAUNCH_V1, FEATURE_FIRST_USERS_V1, FEATURE_ADS_ENGINE_V1) is enabled — confirm intentional.",
    evidence: {
      FEATURE_SOFT_LAUNCH_V1: process.env.FEATURE_SOFT_LAUNCH_V1 ?? "(unset)",
      FEATURE_FIRST_USERS_V1: process.env.FEATURE_FIRST_USERS_V1 ?? "(unset)",
      FEATURE_ADS_ENGINE_V1: process.env.FEATURE_ADS_ENGINE_V1 ?? "(unset)",
    },
  });

  const sec = process.env.FEATURE_SECURITY_GLOBAL_V1;
  items.push({
    id: "security_hardening_note",
    ok: true,
    severity: "info",
    detail:
      "FEATURE_SECURITY_GLOBAL_V1 defaults to ON when unset (opt-out with false). Current: " +
      (sec === "false" || sec === "0" ? "disabled" : "enabled_or_default_on"),
    evidence: { FEATURE_SECURITY_GLOBAL_V1: sec ?? "(unset → on)" },
  });

  return items;
}
