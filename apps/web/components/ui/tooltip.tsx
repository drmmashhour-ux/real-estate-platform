"use client";

import * as React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} type="button" className={cn("cursor-default", className)} {...props} />
  )
);
TooltipTrigger.displayName = "TooltipTrigger";

function TooltipContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-md border border-white/10 bg-[#1a1a1a] px-3 py-1.5 text-sm text-white/90 shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
