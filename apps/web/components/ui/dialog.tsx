"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimal dialog shell (no Radix) for compliance + internal modals. */

export function Dialog({ open, children }: { open?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div className="relative z-[91]">{children}</div>
    </div>
  );
}

export function DialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl outline-none",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold text-white", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />;
}
