import Link from "next/link";

export type SoinsResidenceCardVm = {
  id: string;
  title: string;
  city: string;
  type: string;
  basePrice: number;
  description?: string | null;
  /** For filtering by offered service categories */
  serviceCategories?: string[];
};

export function SoinsResidenceCard(props: {
  vm: SoinsResidenceCardVm;
  href: string;
  currency?: string;
}) {
  const cur = props.currency ?? "CAD";

  return (
    <Link
      href={props.href}
      className="group block rounded-[28px] border border-[#D4AF37]/18 bg-[#0D0D0D] p-6 shadow-lg shadow-black/50 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/45"
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/75">Résidence</p>
      <h3 className="mt-3 font-serif text-2xl font-semibold text-white group-hover:text-[#D4AF37]">
        {props.vm.title}
      </h3>
      <p className="mt-2 text-[17px] text-white/55">{props.vm.city}</p>
      <p className="mt-3 text-sm uppercase tracking-wide text-white/35">{props.vm.type.replace(/_/g, " ")}</p>
      <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-white/45">À partir de</span>
        <span className="text-xl font-semibold text-[#D4AF37]">
          {props.vm.basePrice.toLocaleString(undefined, {
            style: "currency",
            currency: cur,
          })}
          <span className="text-sm font-normal text-white/35"> / mois</span>
        </span>
      </div>
    </Link>
  );
}
