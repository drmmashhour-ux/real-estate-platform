"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderClient from "./HeaderClient";
import { isInvestmentShellPath } from "@/lib/product-focus";

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

  return <HeaderClient loggedIn={loggedIn} roleCookie={roleCookie} />;
}
