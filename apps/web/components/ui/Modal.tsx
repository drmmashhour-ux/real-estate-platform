"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-[101] w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/50">
        {title ? (
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
        ) : null}
        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}
