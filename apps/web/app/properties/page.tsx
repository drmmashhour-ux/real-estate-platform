import { PropertiesPageChat } from "@/components/ai/PropertiesPageChat";
import { PropertiesBrowseClient } from "@/components/properties/PropertiesBrowseClient";
import { getBrowsePropertyCards } from "@/lib/simulation/browse-properties";

export default async function PropertiesPage() {
  const cards = await getBrowsePropertyCards();

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Properties</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Explore curated opportunities</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Browse a selection of vetted homes, investments, and rentals designed to balance lifestyle and long‑term
            performance. Listings combine database FSBO publishes with demo fallbacks when the catalog is empty.
          </p>
        </div>
      </section>

      <PropertiesBrowseClient initial={cards} />
      <PropertiesPageChat />
    </main>
  );
}
