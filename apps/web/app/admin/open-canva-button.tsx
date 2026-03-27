"use client";

import { CANVA_HOME } from "@/lib/canva/templates";

export function OpenCanvaAdminButton() {
  const handleOpen = () => {
    window.open(CANVA_HOME, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    >
      Open Canva (Admin)
    </button>
  );
}
