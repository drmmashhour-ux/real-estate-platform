"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { HadialinkLiteModeRuntime } from "@/lib/hadia-lite/ModeContext";

/** HadiaLink (Syria market) isolated runtime — skips Canada and other hubs. */
export function HadiaLiteModeGate({ children }: { children: ReactNode }) {
  const { country } = useParams<{ country?: string }>();
  if ((country ?? "").toLowerCase() !== "sy") {
    return <>{children}</>;
  }

  return <HadialinkLiteModeRuntime>{children}</HadialinkLiteModeRuntime>;
}
