import Link from "next/link";

type Props = {
  cityLabel: string;
  brokerSignUpHref: string;
  browseHref: string;
};

export function BrokerCTA({ cityLabel, brokerSignUpHref, browseHref }: Props) {
  return (
    <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-center text-white sm:p-8">
      <h2 className="text-2xl font-semibold">Work with {cityLabel} demand on LECIPM</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">
        We prioritize routed intent, transparent workflows, and training — not bulk cold leads. Explore partner
        resources or browse live inventory in your market.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={brokerSignUpHref}
          className="inline-flex rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-400"
        >
          Broker programs
        </Link>
        <Link
          href={browseHref}
          className="inline-flex rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          See activity in {cityLabel}
        </Link>
      </div>
    </div>
  );
}
