import Link from "next/link";

export default function CopyrightPageFr() {
  return (
    <>
      <h1 className="text-3xl font-bold text-white">Droit d&apos;auteur et propriété</h1>
      <p className="mt-4 text-[#D4D4D4]">
        <strong className="text-[#E8C547]">LECIPM</strong> (Mashhour Investments).{" "}
        <strong>Tous droits réservés.</strong>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3]">
        Contenu, conception, marque, logiciel, bases de données et fonctionnalités sont la propriété exclusive de LECIPM
        sauf mention contraire. Pas de reproduction ou d’usage de marque sans autorisation.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/legal/copyright" className="text-[#C9A646] hover:underline">
          Version anglaise détaillée
        </Link>
      </p>
    </>
  );
}
