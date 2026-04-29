"use client";

type Props = {
  basePath?: string;
};

export default function LandingHero({ basePath = "" }: Props) {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden pt-[72px]">
      <div aria-hidden className="absolute inset-0 -z-10 bg-black" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/60 to-black/90"
      />

      <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
          Where Prestige Meets <span className="text-[#C9A96A]">Smart Real Estate</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300">
          AI-powered real estate investment platform designed for clarity, precision, and high-value decision making.
        </p>

        <form
          className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const value = String(fd.get("search") ?? "").trim();
            const qp = value ? `?city=${encodeURIComponent(value)}` : "";
            window.location.href = `${basePath}/listings${qp}`;
          }}
        >
          <label htmlFor="luxury-landing-search-final" className="sr-only">
            Search listings
          </label>
          <input
            id="luxury-landing-search-final"
            name="search"
            type="text"
            autoComplete="off"
            placeholder="Search by city, address, or listing ID"
            className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A96A]/40 sm:w-[500px]"
          />
          <button
            type="submit"
            className="rounded-2xl bg-[#C9A96A] px-8 py-5 font-semibold text-black shadow-[0_0_30px_rgba(201,169,106,0.4)] transition hover:bg-[#E5C07B]"
          >
            Search properties
          </button>
        </form>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-neutral-400">
          <span>✔ Trusted platform</span>
          <span>✔ AI insights</span>
          <span>✔ Verified listings</span>
        </div>
      </div>
    </section>
  );
}
