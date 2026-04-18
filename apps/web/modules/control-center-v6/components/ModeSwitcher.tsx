"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommandCenterV6Mode } from "../company-command-center-v6.types";

const MODES: { id: CommandCenterV6Mode; label: string }[] = [
  { id: "weekly_board_pack", label: "Weekly Board Pack" },
  { id: "due_diligence", label: "Due Diligence" },
  { id: "launch_war_room", label: "Launch War Room" },
  { id: "audit_trail", label: "Audit Trail" },
];

function parseMode(raw: string | null): CommandCenterV6Mode {
  const r = (raw ?? "weekly_board_pack").trim().toLowerCase().replace(/-/g, "_");
  if (r === "weeklyboardpack" || r === "board") return "weekly_board_pack";
  if (r === "duediligence" || r === "diligence") return "due_diligence";
  if (r === "launchwarroom" || r === "warroom") return "launch_war_room";
  if (r === "audittrail" || r === "audit") return "audit_trail";
  if (MODES.some((m) => m.id === r)) return r as CommandCenterV6Mode;
  return "weekly_board_pack";
}

export function useCommandCenterV6ModeFromUrl(): CommandCenterV6Mode {
  const searchParams = useSearchParams();
  return parseMode(searchParams.get("mode"));
}

export function ModeSwitcher({ active }: { active: CommandCenterV6Mode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(id: CommandCenterV6Mode) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("mode", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-px">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => select(id)}
          className={`rounded-t-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
            active === id ? "bg-zinc-900 text-amber-300" : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
