import { getDemoHadialiteListingSlice } from "@/lib/hadia-lite/demo-products";
import { HadiaLiteProductsClient } from "@/components/hadia-lite/HadiaLiteProductsClient";

type Props = { params: Promise<{ locale: string; country: string }> };

const INITIAL = 8;

export default async function HadiaLinkLiteProductsPage(props: Props) {
  const { locale } = await props.params;
  const { items, hasMore, nextPage } = getDemoHadialiteListingSlice(1, INITIAL);

  return (
    <>
      <h1 className="text-lg font-semibold tracking-tight">Hadia · Lite catalogue</h1>
      <p className="mt-1 text-xs text-neutral-600">Text-first rows · paginated API · optional images on detail.</p>
      <HadiaLiteProductsClient
        locale={locale}
        initialItems={items}
        initialHasMore={hasMore}
        initialNextPage={nextPage}
        initialLimit={INITIAL}
      />
    </>
  );
}
