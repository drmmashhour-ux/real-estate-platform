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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ds-bg/60 p-4 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        className={`relative z-[101] w-full max-h-[min(90dvh,880px)] overflow-y-auto ${maxW} rounded-2xl border border-ds-border bg-ds-bg text-ds-text shadow-ds-soft motion-safe:transition motion-safe:duration-200 sm:rounded-[var(--ds-radius-xl)]`}
      >
        <div className="p-6 sm:p-8">
          {title ?
            <h2 id="modal-title" className="text-lg font-bold tracking-tight sm:text-xl">
              {title}
            </h2>
          : null}
          <div className={title ? "mt-4 text-ds-text-secondary" : "text-ds-text-secondary"}>{children}</div>
        </div>
        {footer ?
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ds-border bg-ds-card/40 px-6 py-4 sm:px-8">
            {footer}
          </footer>
        : null}
      </div>
    </div>
  );
}
