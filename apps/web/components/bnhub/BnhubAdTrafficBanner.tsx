/**
 * Above-the-fold strip for paid/social landings: city headline + quick trust cues.
 */
export function BnhubAdTrafficBanner({
  city,
  verified,
  stripeCheckoutAvailable,
}: {
  city: string;
  verified: boolean;
  stripeCheckoutAvailable: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#006ce4]/25 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4">
      <p className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        <span className="mr-1.5 inline-block text-[#006ce4]" aria-hidden>
          🔥
        </span>
        Featured stay in <span className="text-slate-900">{city}</span>
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:flex-row sm:flex-wrap sm:gap-x-8">
        {verified ? (
          <li className="flex items-center gap-2">
            <span className="text-emerald-600" aria-hidden>
              ✔
            </span>
            Verified listing
          </li>
        ) : null}
        <li className="flex items-center gap-2">
          <span className="text-emerald-600" aria-hidden>
            ✔
          </span>
          Secure booking
          {stripeCheckoutAvailable ? (
            <span className="text-xs font-normal text-slate-500">(checkout via Stripe)</span>
          ) : null}
        </li>
      </ul>
    </div>
  );
}
