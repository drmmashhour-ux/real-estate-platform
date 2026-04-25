"use client";

import { useEffect } from "react";
import { useLeciSurface } from "./LeciPlatformContext";

type Props = {
  userRole: string;
  draftSummary?: string;
  focusTopic?: string;
  sectionLabel?: string;
  complianceState?: string;
};

/**
 * Sets LECI URL-adjacent context for the current route. Clear on unmount.
 * Use on drafting, review, broker dashboard, etc.
 */
export function LeciSurfaceBootstrap({
  userRole,
  draftSummary,
  focusTopic,
  sectionLabel,
  complianceState,
}: Props) {
  const { setLeciSurface } = useLeciSurface();

  useEffect(() => {
    setLeciSurface({
      userRole,
      draftSummary,
      focusTopic,
      sectionLabel,
      complianceState,
    });
    return () =>
      setLeciSurface({
        userRole: undefined,
        draftSummary: undefined,
        focusTopic: undefined,
        sectionLabel: undefined,
        complianceState: undefined,
      });
  }, [userRole, draftSummary, focusTopic, sectionLabel, complianceState, setLeciSurface]);

  return null;
}
