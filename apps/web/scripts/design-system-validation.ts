/**
 * Design system validation — file presence + import smoke checks.
 * Run: pnpm exec tsx scripts/design-system-validation.ts (from apps/web)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

function pass(name: string) {
  console.log(`PASS — ${name}`);
}

function fail(name: string, detail?: string) {
  console.error(`FAIL — ${name}${detail ? `: ${detail}` : ""}`);
  process.exitCode = 1;
}

async function main() {
  console.info("LECIPM design system validation\n");
  const root = process.cwd();

  const files = [
    "design-system/tokens.ts",
    "design-system/colors.ts",
    "design-system/typography.ts",
    "design-system/spacing.ts",
    "design-system/radii.ts",
    "design-system/shadows.ts",
    "design-system/motion.ts",
    "design-system/icons.ts",
    "design-system/component-variants.ts",
    "design-system/design-system.css",
    "components/ui/Button.tsx",
    "components/ui/Card.tsx",
    "components/ui/Input.tsx",
    "components/ui/Select.tsx",
    "components/ui/Toggle.tsx",
    "components/ui/Badge.tsx",
    "components/ui/Alert.tsx",
    "components/ui/Modal.tsx",
    "components/ui/Drawer.tsx",
    "components/ui/Table.tsx",
    "components/ui/Tabs.tsx",
    "components/ui/Tooltip.tsx",
    "components/ui/EmptyState.tsx",
    "components/ui/Skeleton.tsx",
    "components/ui/Avatar.tsx",
    "components/ui/StatCard.tsx",
    "components/ui/SectionHeader.tsx",
    "components/ui/dashboard-widgets.tsx",
    "components/ui/senior.tsx",
    "app/[locale]/[country]/internal/design-system/page.tsx",
    "../../docs/design-system/ui-qa-checklist.md",
  ];

  for (const f of files) {
    const p = join(root, f);
    if (!existsSync(p)) fail("missing file", f);
  }
  pass("all core files on disk");

  try {
    await import("@/design-system");
    await import("@/components/ui/Button");
    await import("@/components/ui/Alert");
    await import("@/components/ui/dashboard-widgets");
    pass("core modules import");
  } catch (e) {
    fail("import", e instanceof Error ? e.message : String(e));
  }

  const tokenPath = join(root, "design-system/design-system.css");
  const css = await import("node:fs").then((fs) => fs.promises.readFile(tokenPath, "utf8"));
  if (!css.includes("--lecipm-brand-gold")) fail("design-system.css missing gold token");
  pass("CSS variables contain brand gold");

  console.info("\nDone. Exit code:", process.exitCode ?? 0);
}

void main();
