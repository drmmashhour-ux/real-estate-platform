import type { BrandIdentity } from "../../brand/brandConfig.js";
import { escapeHtml } from "../html.js";

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface DashboardShellInput {
  brand: BrandIdentity;
  title: string;
  subtitle?: string;
  activeSection: string;
  body: string;
}

const NAVIGATION: readonly NavigationItem[] = Object.freeze([
  { label: "Overview", href: "/dashboard/overview" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Settlements", href: "/dashboard/settlements" },
  { label: "Fees", href: "/dashboard/fees" },
  { label: "Settings", href: "/dashboard/settings" },
]);

export function renderDashboardShell(input: DashboardShellInput): string {
  const tokens = input.brand.tokens;
  const navigation = NAVIGATION.map((item) => {
    const active = item.label.toLowerCase() === input.activeSection.toLowerCase();
    return `<a class="nav-item ${active ? "active" : ""}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)} - ${escapeHtml(input.brand.brandName)}</title>
  <style>
    body { margin: 0; background: ${tokens.colors.background}; color: ${tokens.colors.text}; font-family: ${tokens.typography.fontFamily}; }
    .shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
    .sidebar { background: ${tokens.colors.surface}; border-right: 1px solid ${tokens.colors.border}; padding: ${tokens.spacing.lg}; }
    .brand { display: flex; align-items: center; gap: ${tokens.spacing.sm}; font-weight: ${tokens.typography.weights.bold}; font-size: ${tokens.typography.sizes.lg}; margin-bottom: ${tokens.spacing.xl}; }
    .brand-mark { width: 36px; height: 36px; border-radius: ${tokens.radii.md}; background: linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.secondary}); }
    .nav-item { display: block; padding: ${tokens.spacing.sm} ${tokens.spacing.md}; border-radius: ${tokens.radii.md}; color: ${tokens.colors.textMuted}; text-decoration: none; margin-bottom: ${tokens.spacing.xs}; }
    .nav-item.active { background: ${tokens.colors.primary}; color: white; }
    .topbar { height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 ${tokens.spacing.xl}; border-bottom: 1px solid ${tokens.colors.border}; background: ${tokens.colors.surface}; }
    .content { padding: ${tokens.spacing.xl}; }
    .card { background: ${tokens.colors.surfaceRaised}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radii.lg}; padding: ${tokens.spacing.lg}; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${tokens.spacing.md}; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: ${tokens.spacing.sm}; border-bottom: 1px solid ${tokens.colors.border}; }
    .muted { color: ${tokens.colors.textMuted}; }
    .status { border-radius: ${tokens.radii.pill}; padding: ${tokens.spacing.xs} ${tokens.spacing.sm}; font-size: ${tokens.typography.sizes.xs}; }
    .status.neutral { background: ${tokens.colors.border}; color: ${tokens.colors.text}; }
    .status.success { background: rgba(22, 163, 74, 0.16); color: ${tokens.colors.success}; }
    .status.warning { background: rgba(217, 119, 6, 0.16); color: ${tokens.colors.warning}; }
    .status.danger { background: rgba(220, 38, 38, 0.16); color: ${tokens.colors.danger}; }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark"></div><span>${escapeHtml(input.brand.brandName)}</span></div>
      <nav>${navigation}</nav>
    </aside>
    <section>
      <header class="topbar">
        <div><strong>${escapeHtml(input.title)}</strong><div class="muted">${escapeHtml(input.subtitle ?? "Merchant operations console")}</div></div>
        <div class="muted">${escapeHtml(input.brand.supportContact)}</div>
      </header>
      <main class="content">${input.body}</main>
    </section>
  </div>
</body>
</html>`;
}
