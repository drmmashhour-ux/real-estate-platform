import { redirect } from "next/navigation";

/**
 * Canonical guest/stays ads URL — forwards to `/ads/bnhub` with query preserved (UTMs, city, etc.).
 */
export default async function AdsBnhubStaysAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = (await searchParams) ?? {};
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") q.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
  }
  const suffix = q.toString();
  redirect(`/${locale}/${country}/ads/bnhub${suffix ? `?${suffix}` : ""}`);
}
