"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommandCenterMode } from "../company-command-center-v5.types";

const MODES: { id: CommandCenterMode; label: string }[] = [
  { id: "morning_brief", label: "Morning Brief" },
  { id: "incident", label: "Incident" },
  { id: "launch", label: "Launch" },
  { id: "investor", label: "Investor" },
];

function parseMode(raw: string | null): CommandCenterMode {
  const r = (raw ?? "morning_brief").trim().toLowerCase().replace(/-/g, "_");
  if (r === "morningbrief") return "morning_brief";
  if (r === "incident" || r === "launch" || r === "investor") return r;
  return "morning_brief";
}

export function useCommandCenterV5ModeFromUrl(): CommandCenterMode {
  const searchParams = useSearchParams();
  return parseMode(searchParams.get("mode"));
}

export function ModeSwitcher({ active }: { active: CommandCenterMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(id: CommandCenterMode) {
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
