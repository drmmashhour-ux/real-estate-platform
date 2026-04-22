"use client";

import { useMemo, useState } from "react";

import { SoinsResidenceCard, type SoinsResidenceCardVm } from "@/components/soins/SoinsResidenceCard";

export function SoinsBrowseClient(props: {
  residences: SoinsResidenceCardVm[];
  locale: string;
  country: string;
}) {
  const [type, setType] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [serviceKind, setServiceKind] = useState<string>("ANY");

  const filtered = useMemo(() => {
    return props.residences.filter((r) => {
      if (type !== "ALL" && r.type !== type) return false;
      if (maxPrice !== "" && r.basePrice > maxPrice) return false;
      if (serviceKind !== "ANY") {
        const cats = r.serviceCategories;
        if (cats?.length && !cats.includes(serviceKind)) return false;
      }
      return true;
    });
  }, [props.residences, type, maxPrice, serviceKind]);

  const hub = `/${props.locale}/${props.country}/soins`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:pb-12">
      <div className="rounded-3xl border border-[#D4AF37]/15 bg-[#080808] p-6">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Filtrer</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block text-sm text-white/60">
            Niveau / type
            <select
              className="mt-2 w-full rounded-xl border border-white/12 bg-black px-4 py-3 text-[17px] text-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ALL">Tous</option>
              <option value="INDEPENDENT">Indépendant</option>
              <option value="ASSISTED">Assisté</option>
              <option value="MEDICAL">Médical</option>
            </select>
          </label>
          <label className="block text-sm text-white/60">
            Budget max (mois)
            <input
              type="number"
              inputMode="numeric"
              placeholder="ex. 7000"
              className="mt-2 w-full rounded-xl border border-white/12 bg-black px-4 py-3 text-[17px] text-white placeholder:text-white/30"
              value={maxPrice === "" ? "" : maxPrice}
              onChange={(e) => {
                const v = e.target.value;
                setMaxPrice(v === "" ? "" : Number(v));
              }}
            />
          </label>
          <label className="block text-sm text-white/60">
            Service recherché
            <select
              className="mt-2 w-full rounded-xl border border-white/12 bg-black px-4 py-3 text-[17px] text-white"
              value={serviceKind}
              onChange={(e) => setServiceKind(e.target.value)}
            >
              <option value="ANY">Tous</option>
              <option value="MEDICAL">Médical</option>
              <option value="DAILY_LIVING">Quotidien</option>
              <option value="SAFETY">Sécurité</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-lg text-white/45">
            Aucune résidence ne correspond à ces critères.
          </p>
        ) : (
          filtered.map((r) => (
            <SoinsResidenceCard key={r.id} vm={r} href={`${hub}/${r.id}`} />
          ))
        )}
      </div>
    </div>
  );
}
