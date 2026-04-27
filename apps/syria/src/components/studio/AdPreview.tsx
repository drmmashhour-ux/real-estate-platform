import type { AdStudioStyle, AdStudioPreviewListing } from "@/lib/ad-studio";

type Props = {
  listing: AdStudioPreviewListing;
  /** Template id — not the DOM `style` attribute. */
  style: AdStudioStyle;
};

/**
 * CSS-only promo cards: plain JSX + Tailwind. No canvas, no image processing, no extra fonts.
 */
export function AdPreview({ listing, style: adStyle }: Props) {
  const { image, title, price, city } = listing;

  const imageBlock = image ? (
    <img
      src={image}
      alt=""
      className="h-40 w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div
      className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-400 text-4xl text-stone-600"
      role="img"
      aria-label=""
    >
      🏷️
    </div>
  );

  if (adStyle === "price") {
    return (
      <div className="max-w-sm overflow-hidden rounded-lg bg-black p-4 text-white shadow-lg">
        {imageBlock}
        <div className="mt-2 text-xl font-bold tabular-nums text-green-400">{price}</div>
        <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white/90">{title}</div>
        <div className="mt-1 text-sm text-stone-400">{city}</div>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-stone-500">Hadiah Link</p>
      </div>
    );
  }

  if (adStyle === "highlight") {
    return (
      <div className="max-w-sm overflow-hidden rounded-lg bg-red-600 p-4 text-white shadow-lg">
        {image ? (
          <img
            src={image}
            alt=""
            className="mb-3 h-28 w-full rounded object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="text-lg font-bold leading-snug">{title}</div>
        <div className="mt-2 text-base font-bold tabular-nums text-amber-200">{price}</div>
        <div className="mt-1 text-sm text-red-100">{city}</div>
        <p className="mt-3 text-center text-[10px] font-bold uppercase text-red-200">Hadiah Link</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm rounded-lg border border-[#2A2A2A] bg-[#111] p-4 text-white shadow-lg">
      {image ? (
        <img
          src={image}
          alt=""
          className="mb-3 h-32 w-full rounded object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="font-semibold leading-snug">{title}</div>
      <div className="mt-2 tabular-nums text-emerald-400">{price}</div>
      <div className="mt-1 text-sm text-stone-400">{city}</div>
      <p className="mt-3 text-center text-[10px] text-stone-500">Hadiah Link</p>
    </div>
  );
}
