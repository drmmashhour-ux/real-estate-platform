"use client";

import {
  BarChart3,
  Building2,
  GitCompare,
  HelpCircle,
  Home,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isInvestmentShellPath } from "@/lib/product-focus";
import { appPathnameFromUrl } from "@/i18n/pathname";

/** Single source for mobile chrome order (global tab bar below main content). */
const NAV_ITEMS: { key: string; label: string; icon: LucideIcon; href: string }[] = [
  { key: "analyze", label: "Analyze", icon: BarChart3, href: "/analyze" },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "compare", label: "Compare", icon: GitCompare, href: "/compare" },
  { key: "buying", label: "Buying", icon: Home, href: "/listings" },
  { key: "host", label: "Host", icon: Building2, href: "/host" },
  { key: "support", label: "Support", icon: HelpCircle, href: "/support" },
];

function routeActive(itemKey: string, pathname: string): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/embed") || pathname.startsWith("/auth")) return false;

  switch (itemKey) {
    case "analyze":
      return pathname.includes("/analyze");
    case "dashboard":
      return pathname.includes("/dashboard");
    case "compare":
      return pathname.includes("/compare");
    case "buying":
      return pathname.includes("/listings");
    case "host":
      return pathname.includes("/host");
    case "support":
      return pathname.includes("/support");
    default:
      return false;
  }
}

/** Fixed primary tab navigation for small viewports. Desktop uses header + side nav. */
export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  if (appPathnameFromUrl(pathname) === "/") {
    return null;
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/auth") ||
    pathname.includes("/m/") ||
    pathname.endsWith("/m") ||
    isInvestmentShellPath(pathname)
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Primary mobile"
      className={[
        "fixed bottom-0 left-0 z-[70] w-full border-t border-neutral-800 bg-black/95 backdrop-blur-md",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
        "lg:hidden",
      ].join(" ")}
    >
      <div className="flex items-center justify-around gap-1 px-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = routeActive(item.key, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-center transition-colors",
                "text-[10px] font-medium leading-none sm:text-[11px]",
                active ? "text-[#D4AF37]" : "text-neutral-400 hover:text-[#D4AF37]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
              <span className="line-clamp-2 w-full px-px">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
