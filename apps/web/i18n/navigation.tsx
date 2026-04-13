"use client";

import type { ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { useParams } from "next/navigation";
import { ROUTED_COUNTRY_SLUGS, type CountryCodeLower } from "@/config/countries";
import { routing } from "./routing";

const {
  Link: BaseLink,
  redirect,
  usePathname: usePathnameBase,
  useRouter: useRouterBase,
  getPathname,
} = createNavigation(routing);

function withCountryPrefix(href: string, country: string): string {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return href;
  }
  const h = href.startsWith("/") ? href : `/${href}`;
  const parts = h.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  if (first && (ROUTED_COUNTRY_SLUGS as readonly string[]).includes(first)) {
    return h;
  }
  const c = country.toLowerCase() as CountryCodeLower;
  if (h === "/") return `/${c}`;
  return `/${c}${h}`;
}

/** next-intl `Link` with automatic `/{country}` prefix for app routes. */
export function Link(props: ComponentProps<typeof BaseLink>) {
  const params = useParams() as { country?: string };
  const country = params?.country ?? "ca";
  const href = props.href;
  if (typeof href === "string") {
    return <BaseLink {...props} href={withCountryPrefix(href, country)} />;
  }
  return <BaseLink {...props} />;
}

export { redirect, usePathnameBase as usePathname, useRouterBase as useRouter, getPathname };
