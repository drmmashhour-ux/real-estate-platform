import React from "react";

export function ModeBanner({ mode }: { mode: string }) {
  if (mode === "LIVE") return null;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 mb-8">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg">SIM</span>
        <div>
          <p className="text-sm font-bold text-white">Simulation Mode Active</p>
          <p className="text-xs text-blue-200/80 mt-0.5">
            This fund is operating in <strong>Simulation Mode</strong>. No real capital will be moved, and all performance metrics are projected for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
