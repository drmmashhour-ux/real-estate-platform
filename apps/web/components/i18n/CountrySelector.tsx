"use client";

import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  ROUTED_COUNTRY_SLUGS,
  getCountryBySlug,
  type CountryCodeLower,
} from "@/config/countries";
import { COUNTRY_COOKIE } from "@/lib/region/country-cookie";
import { HEADER_SELECT } from "@/components/layout/header-action-classes";

/** Strips leading `/{country}` from next-intl pathname (`/ca/listings` → `/listings`). */
function stripLeadingCountry(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const parts = p.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  if (first && (ROUTED_COUNTRY_SLUGS as readonly string[]).includes(first)) {
    const rest = parts.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return p;
}

export function CountrySelector({ className = "", variant = "header" as const }: { className?: string; variant?: "header" | "dark" }) {
  const params = useParams() as { locale?: string; country?: string };
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const current = (params.country ?? "ca").toLowerCase() as CountryCodeLower;

  const selectClass =
    variant === "header"
      ? HEADER_SELECT
      : "cursor-pointer rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs font-medium text-white";

  return (
    <label className={`flex items-center gap-1.5 ${className}`}>
      <span className="sr-only">Country</span>
      <select
        className={selectClass}
        value={current}
        aria-label="Country"
        onChange={(e) => {
          const next = e.target.value.toLowerCase() as CountryCodeLower;
          const rest = stripLeadingCountry(pathname);
          const targetPath = `/${next}${rest === "/" ? "" : rest}`;
          document.cookie = `${COUNTRY_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
          router.replace(targetPath);
        }}
      >
        {ROUTED_COUNTRY_SLUGS.map((slug) => {
          const c = getCountryBySlug(slug);
          if (!c) return null;
          return (
            <option key={slug} value={slug}>
              {c.flag} {c.name}
            </option>
          );
        })}
      </select>
    </label>
  );
}
