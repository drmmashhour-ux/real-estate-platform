import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Opt entire `/dashboard/*` tree out of static / cached RSC (session must be evaluated every request). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardRouteGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
