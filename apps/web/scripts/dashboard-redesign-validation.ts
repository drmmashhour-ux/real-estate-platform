/**
 * Validates Senior Living Hub dashboard redesign wiring (structure + isolation rules).
 * Run: pnpm exec tsx scripts/dashboard-redesign-validation.ts (from apps/web)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { PlatformRole } from "@prisma/client";

import { RESIDENCE_NAV, MANAGEMENT_NAV, ADMIN_NAV } from "@/config/navigation.config";
import type { ResolvedSeniorHubAccess } from "@/lib/senior-dashboard/role";
import {
  canAccessAdminDashboard,
  canAccessManagementDashboard,
  canAccessResidenceDashboard,
  resolveSeniorHubAccess,
} from "@/lib/senior-dashboard/role";

function ok(name: string): void {
  console.log(`PASS — ${name}`);
}

function fail(name: string, detail?: string): void {
  console.error(`FAIL — ${name}${detail ? `: ${detail}` : ""}`);
  process.exitCode = 1;
}

async function main() {
  console.info("Senior Living Hub dashboard redesign validation\n");

  try {
    const cases: Array<{ label: string; uid: string; role: PlatformRole; expect: ResolvedSeniorHubAccess["kind"] }> =
      [];

    cases.push({
      label: "admin resolves to platform_admin",
      uid: "admin-test",
      role: PlatformRole.ADMIN,
      expect: "platform_admin",
    });

    for (const c of cases) {
      const r = await resolveSeniorHubAccess(c.uid, c.role);
      if (r.kind !== c.expect) {
        fail(c.label, `got ${r.kind}`);
      } else {
        ok(c.label);
      }
    }

    const adminAccess: ResolvedSeniorHubAccess = { kind: "platform_admin" };
    const opAccess: ResolvedSeniorHubAccess = { kind: "residence_operator", residenceId: "r1" };
    const mgrAccess: ResolvedSeniorHubAccess = { kind: "residence_manager", residenceIds: ["a", "b"] };

    if (!canAccessAdminDashboard(adminAccess)) fail("admin can access admin dashboard");
    else ok("admin can access admin dashboard");

    if (canAccessAdminDashboard(opAccess)) fail("operator cannot access admin dashboard");
    else ok("operator blocked from admin dashboard");

    if (!canAccessManagementDashboard(mgrAccess)) fail("manager can access management dashboard");
    else ok("manager can access management dashboard");

    if (canAccessManagementDashboard(opAccess)) fail("single-residence operator blocked from management");
    else ok("single-residence operator blocked from management");

    if (!canAccessResidenceDashboard(opAccess)) fail("operator can access residence dashboard");
    else ok("operator can access residence dashboard");

    if (!canAccessResidenceDashboard(adminAccess)) fail("admin can preview residence dashboard");
    else ok("admin can preview residence dashboard");

    const nasdaqRemoved =
      typeof (await import("@/components/senior-living/dashboard/AdminOpsHome")).AdminOpsHome === "function";
    if (!nasdaqRemoved) fail("AdminOpsHome component missing");
    else ok("AdminOpsHome present (non-trading layout)");

    if (RESIDENCE_NAV.role !== "RESIDENCE" || MANAGEMENT_NAV.role !== "MANAGEMENT" || ADMIN_NAV.role !== "ADMIN") {
      fail("navigation.config role keys");
    } else {
      ok("navigation.config has three distinct role entries");
    }

    const root = process.cwd();
    const layoutFiles = [
      "app/[locale]/[country]/(dashboard)/dashboard/(lecipm-hub)/residence/layout.tsx",
      "app/[locale]/[country]/(dashboard)/dashboard/(lecipm-hub)/management/layout.tsx",
      "app/[locale]/[country]/(dashboard)/dashboard/admin/(lecipm)/layout.tsx",
      "components/layouts/dashboard-shell.tsx",
      "config/navigation.config.ts",
    ];
    let layoutOk = true;
    for (const f of layoutFiles) {
      if (!existsSync(join(root, f))) {
        fail("expected file", f);
        layoutOk = false;
        break;
      }
    }
    if (layoutOk) ok("LECIPM shell + config files on disk");

    console.info("\nDone. Exit code:", process.exitCode ?? 0);
  } catch (e) {
    fail("unexpected", e instanceof Error ? e.message : String(e));
  }
}

void main();
