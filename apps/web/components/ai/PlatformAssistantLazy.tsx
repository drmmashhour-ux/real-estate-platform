"use client";

import dynamic from "next/dynamic";

/** Lazy, client-only — keeps speech / heavy UI off critical path */
export const PlatformAssistantLazy = dynamic(
  () => import("./PlatformAssistant").then((m) => ({ default: m.PlatformAssistant })),
  {
    ssr: false,
    loading: () => null,
  }
);
