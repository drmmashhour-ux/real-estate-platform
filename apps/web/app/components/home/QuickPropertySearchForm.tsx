"use client";

/**
 * Quick Property Search on the home page.
 * Submits to /projects with query params so the projects page can filter.
 */
export function QuickPropertySearchForm() {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur sm:p-6 lg:max-w-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Quick Property Search
        </h2>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
          Live Market
        </span>
      </div>
      <form
        action="/projects"
        method="get"
        className="space-y-4"
      >
        <div>
          <label htmlFor="quick-q" className="mb-1 block text-xs font-medium text-slate-300">
            Location
          </label>
          <input
            id="quick-q"
            name="q"
            type="text"
            placeholder="City, neighborhood, or ZIP"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quick-priceMin" className="mb-1 block text-xs font-medium text-slate-300">
              Min. budget
            </label>
            <input
              id="quick-priceMin"
              name="priceMin"
              type="number"
              min={0}
              step={10000}
              placeholder="250000"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>
          <div>
            <label htmlFor="quick-filter" className="mb-1 block text-xs font-medium text-slate-300">
              Property type
            </label>
            <select
              id="quick-filter"
              name="filter"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="">Any</option>
              <option value="residential">Residential</option>
              <option value="for-rent">Rental</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Start Searching
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Avg. viewing scheduled in &lt; 24h</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
          New listings today
        </span>
      </div>
    </div>
  );
}
