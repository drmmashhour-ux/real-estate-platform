"use client";

import { useEffect } from "react";
import { persistGrowthUtmFromCurrentUrl } from "@/lib/growth/utm";

/** Runs once on mount — keeps session UTMs for signup / funnel attribution. */
export function UtmSessionInitializer() {
  useEffect(() => {
    persistGrowthUtmFromCurrentUrl();
  }, []);
  return null;
}
