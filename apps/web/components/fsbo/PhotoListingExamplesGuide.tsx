import { LISTING_PHOTO_EXAMPLE_GUIDE } from "@/lib/fsbo/demo-listing-photo-assets";

/**
 * Educational panel: what a good listing gallery looks like (bundled sample thumbnails — not uploaded automatically).
 */
export function PhotoListingExamplesGuide() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4">
      <p className="text-xs font-semibold text-white/90">What to upload (examples)</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Examples use the same bundled stock photos as optional demo uploads (residential interiors and exteriors). Your
        listing photos must show the actual property — clear lighting, real rooms and building, no unrelated art or
        clutter as the main subject.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {LISTING_PHOTO_EXAMPLE_GUIDE.map((item) => (
          <li
            key={item.title}
            className="overflow-hidden rounded-lg border border-white/10 bg-black/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.exampleUrl}
              alt=""
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <div className="p-2">
              <p className="text-[11px] font-medium text-slate-200">{item.title}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{item.caption}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
