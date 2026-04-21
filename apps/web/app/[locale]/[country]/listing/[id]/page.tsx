import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; country: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Short URL alias: `/en/ca/listing/{id}?src=centris` → canonical listings detail (preserves query). */
export default async function ListingShortUrlRedirect({ params, searchParams }: Props) {
  const { locale, country, id } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) qs.append(key, v);
    } else {
      qs.set(key, val);
    }
  }
  const suffix = qs.toString();
  redirect(`/${locale}/${country}/listings/${id}${suffix ? `?${suffix}` : ""}`);
}
