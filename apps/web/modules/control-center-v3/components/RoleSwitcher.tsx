"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommandCenterRole } from "../company-command-center-v3.types";

const ROLES: { id: CommandCenterRole; label: string }[] = [
  { id: "founder", label: "Founder" },
  { id: "growth", label: "Growth" },
  { id: "operations", label: "Operations" },
  { id: "risk_governance", label: "Risk / Governance" },
];

function parseRole(raw: string | null): CommandCenterRole {
  const r = (raw ?? "founder").trim().toLowerCase().replace(/-/g, "_");
  if (r === "growth" || r === "operations" || r === "risk_governance") return r;
  return "founder";
}

export function useCommandCenterV3RoleFromUrl(): CommandCenterRole {
  const searchParams = useSearchParams();
  return parseRole(searchParams.get("role"));
}

export function RoleSwitcher({ active }: { active: CommandCenterRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(id: CommandCenterRole) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("role", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-px">
      {ROLES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => select(id)}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            active === id ? "bg-zinc-900 text-amber-300" : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
