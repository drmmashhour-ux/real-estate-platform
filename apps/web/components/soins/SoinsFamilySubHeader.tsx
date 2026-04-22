import Link from "next/link";

export function SoinsFamilySubHeader(props: { title: string; backHref: string }) {
  return (
    <header className="border-b border-[#D4AF37]/18 px-4 py-5">
      <Link
        href={props.backHref}
        className="text-sm font-medium text-[#D4AF37] underline-offset-4 hover:underline"
      >
        ← Retour
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-white md:text-3xl">{props.title}</h1>
    </header>
  );
}
