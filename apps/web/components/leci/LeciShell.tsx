"use client";

import type { ReactNode } from "react";
import { LeciProvider } from "./LeciPlatformContext";
import { LeciWidget } from "./LeciWidget";

/** Wraps the app with LECI context + floating assistant. Mount once in `app/layout.tsx`. */
export function LeciShell({ children }: { children: ReactNode }) {
  return (
    <LeciProvider>
      {children}
      <LeciWidget />
    </LeciProvider>
  );
}
