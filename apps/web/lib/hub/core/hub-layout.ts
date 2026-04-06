/**
 * Layout contracts for hub shells — slots are optional for progressive adoption.
 */

import type { ReactNode } from "react";

export type HubShellSlots = {
  hero?: ReactNode;
  sidebar?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export type HubBreadcrumbItem = {
  labelKey: string;
  href?: string;
};
