"use client";

import type { ReactNode } from "react";

import type { DashboardTone } from "@/design-system/colors";
import { dashboardToneVars } from "@/design-system/colors";

/**
 * Soft visual differentiation for Residence / Management / Admin (Part 16)
 * — does not fork the component library.
 */
export function DashboardSurface(props: {
  tone: DashboardTone;
  children: ReactNode;
  className?: string;
}) {
  const vars = dashboardToneVars[props.tone];
  return (
    <div className={props.className ?? ""} style={vars as React.CSSProperties}>
      {props.children}
    </div>
  );
}
