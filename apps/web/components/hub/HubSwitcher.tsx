"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HUB_PATHS, type HubKey } from "@/lib/hub/router";
import { getHubTheme } from "@/lib/hub/themes";

const HUB_LABELS: Record<HubKey, string> = {
  bnhub: "BNHub",
  carhub: "CarHub",
  servicehub: "ServiceHub",
  investorhub: "InvestorHub",
  realEstate: "Real Estate",
  luxury: "Luxury",
  broker: "Broker",
  investments: "Investments",
  referrals: "Referrals",
  projects: "Projects",
  admin: "Admin",
};

type HubSwitcherProps = {
  showAdmin?: boolean;
  currentHubKey?: HubKey | null;
};

function pathToHubKey(pathname: string): HubKey | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/hub/carhub")) return "carhub";
  if (pathname.startsWith("/hub/servicehub")) return "servicehub";
  if (pathname.startsWith("/hub/investorhub")) return "investorhub";
  if (pathname.startsWith("/dashboard/bnhub") || pathname.startsWith("/search/bnhub") || pathname.startsWith("/bnhub")) {
    return "bnhub";
  }
  if (pathname.startsWith("/dashboard/real-estate")) return "realEstate";
  if (pathname.startsWith("/dashboard/luxury")) return "luxury";
  if (pathname.startsWith("/dashboard/broker")) return "broker";
  if (pathname.startsWith("/dashboard/investments")) return "investments";
  return null;
}

export function HubSwitcher({ showAdmin = false, currentHubKey: controlledHub }: HubSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [investmentHubEnabled, setInvestmentHubEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/investment-status", { credentials: "same-origin" })
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        if (!cancelled && d?.investmentEnabled === true) setInvestmentHubEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const currentHubKey = controlledHub ?? pathToHubKey(pathname);
  const label = currentHubKey ? HUB_LABELS[currentHubKey] : "Select hub";
  const theme = currentHubKey ? getHubTheme(currentHubKey) : null;

  const engineHubs: HubKey[] = [];
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HUB_CAR_ENABLED === "1") {
    engineHubs.push("carhub");
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HUB_SERVICE_ENABLED === "1") {
    engineHubs.push("servicehub");
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HUB_INVESTOR_SHELL_ENABLED === "1") {
    engineHubs.push("investorhub");
  }

  const hubs: HubKey[] = [
    "bnhub",
    ...engineHubs,
    "realEstate",
    "luxury",
    "broker",
    ...(investmentHubEnabled ? (["investments"] as const) : []),
    "referrals",
    "projects",
  ];
  if (showAdmin) hubs.push("admin");

  const selectHub = useCallback(
    (key: HubKey) => {
      const path = HUB_PATHS[key];
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
        style={theme ? { borderColor: theme.accent + "40", color: theme.accent } : undefined}
      >
        <span>{label}</span>
        <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-slate-900 py-1 shadow-xl"
            role="listbox"
          >
            {hubs.map((key) => (
              <button
                key={key}
                type="button"
                role="option"
                onClick={() => selectHub(key)}
                className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
              >
                {HUB_LABELS[key]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
