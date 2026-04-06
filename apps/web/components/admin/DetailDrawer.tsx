"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

type Props = {
  data: unknown;
  triggerLabel?: string;
  title?: string;
};

/**
 * Slide-over JSON inspector — replaces inline raw JSON in admin tables.
 */
export function DetailDrawer({ data, triggerLabel = "View Details", title = "Details" }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const json = safeStringify(data);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(json);
  }, [json]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel = open && mounted && (
    <div
      className="fixed inset-0 z-[600] flex"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="flex-1 cursor-default bg-black/70"
        aria-label="Close details"
        onClick={() => setOpen(false)}
      />
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:max-w-[min(100vw,28rem)]"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg text-white">{title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <pre className="max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/85">
          {json}
        </pre>

        <button type="button" onClick={onCopy} className="mt-4 text-sm text-[#D4AF37] hover:underline">
          Copy JSON
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-[#D4AF37] hover:underline">
        {triggerLabel}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
