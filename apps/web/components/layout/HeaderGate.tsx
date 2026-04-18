"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderClient from "./HeaderClient";
import { isSelfContainedToolChromePath } from "@/lib/layout/self-contained-tool-paths";
import { isInvestmentShellPath } from "@/lib/product-focus";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";

const LANDING_V1_PUBLIC =
  process.env.NEXT_PUBLIC_FEATURE_LANDING_V1 === "true" || process.env.NEXT_PUBLIC_FEATURE_LANDING_V1 === "1";

/**
 * Renders the global header except on investment-shell pages that already use MvpNav.
 */
export function HeaderGate() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [roleCookie, setRoleCookie] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoggedIn(
        typeof document !== "undefined" && /(?:^|;)\s*lecipm_guest_id=/.test(document.cookie)
      );
      const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)hub_user_role=([^;]*)/) : null;
      setRoleCookie(m?.[1] ? decodeURIComponent(m[1]) : null);
    } catch {
      setLoggedIn(false);
    }
  }, [pathname]);

  if (isInvestmentShellPath(pathname)) {
    return null;
  }

  /** Admin uses its own shell; global marketing header overlaps nav and confuses clicks. */
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  /** ToolShell pages ship a unified LECIPM header (logo + title); skip the global bar. */
  if (isSelfContainedToolChromePath(pathname)) {
    return null;
  }

  /** Full marketing landing v1 ships its own sticky nav — avoid duplicate headers on home. */
  if (LANDING_V1_PUBLIC && pathname && isMarketingHomePath(pathname)) {
    return null;
  }

  return <HeaderClient loggedIn={loggedIn} roleCookie={roleCookie} />;
}
