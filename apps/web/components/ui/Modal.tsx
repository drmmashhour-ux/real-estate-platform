"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  size = "md",
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
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

  const maxW =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        className={`relative z-[101] w-full ${maxW} rounded-[var(--ds-radius-xl)] border border-white/10 bg-[#151515] shadow-[var(--ds-shadow-modal)] motion-safe:transition motion-safe:duration-200`}
      >
        <div className="p-6">
          {title ?
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
          : null}
          <div className={title ? "mt-4 text-zinc-200" : "text-zinc-200"}>{children}</div>
        </div>
        {footer ?
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-6 py-4">{footer}</footer>
        : null}
      </div>
    </div>
  );
}
