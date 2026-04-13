"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";

const ImmoChatWidget = dynamic(
  () => import("./ImmoChatWidget").then((m) => ({ default: m.ImmoChatWidget })),
  { ssr: false, loading: () => null }
);

/** Defers chat bundle until client hydration; hidden on marketing home to reduce overload. */
export function ImmoChatWidgetLazy() {
  const pathname = usePathname() ?? "";
  if (isMarketingHomePath(pathname)) return null;
  return <ImmoChatWidget />;
}
