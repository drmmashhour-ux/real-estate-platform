"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  getConversionEngineFlagsEffective,
  type EffectiveConversionFlags,
} from "@/config/rollout";

/**
 * Path-aware conversion flags for client components (rollout partial/internal + kill switch).
 */
export function useConversionEngineFlags(opts?: { isPrivilegedUser?: boolean }): EffectiveConversionFlags {
  const pathname = usePathname();
  return useMemo(
    () =>
      getConversionEngineFlagsEffective({
        pathname: pathname || undefined,
        isPrivilegedUser: opts?.isPrivilegedUser,
      }),
    [pathname, opts?.isPrivilegedUser],
  );
}
