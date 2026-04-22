"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

export function Drawer({
  open,
  title,
  children,
  footer,
  onClose,
  side = "right",
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110]">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <aside
        className={[
          "absolute top-0 flex h-full w-full max-w-md flex-col border-white/10 bg-[#0B0B0B] shadow-[var(--ds-shadow-modal)] motion-safe:transition-transform motion-safe:duration-[240ms] motion-safe:ease-out",
          side === "right" ? "right-0 translate-x-0 border-l" : "left-0 translate-x-0 border-r",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          {title ?
            <h2 id="drawer-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
          : <span />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-zinc-200">{children}</div>
        {footer ?
          <footer className="border-t border-white/10 px-5 py-4">{footer}</footer>
        : null}
      </aside>
    </div>
  );
}
