"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { recordSeoCityPageView } from "@/modules/seo-city/seo-city-telemetry.client";

type Props = { path?: string };

export function SeoCityTracker({ path }: Props) {
  const pathname = usePathname();
  useEffect(() => {
    recordSeoCityPageView(path ?? pathname);
  }, [path, pathname]);
  return null;
}
