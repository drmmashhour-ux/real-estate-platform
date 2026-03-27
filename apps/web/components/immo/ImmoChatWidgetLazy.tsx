"use client";

import dynamic from "next/dynamic";

/** Defers chat bundle until client hydration; keeps global layout JS smaller on first paint. */
export const ImmoChatWidgetLazy = dynamic(
  () => import("./ImmoChatWidget").then((m) => ({ default: m.ImmoChatWidget })),
  { ssr: false, loading: () => null }
);
