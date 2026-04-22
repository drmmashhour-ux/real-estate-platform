"use client";

import Link from "next/link";

import { FamilyTileGrid } from "@/components/soins/FamilyTileGrid";

export function SoinsFamilyHomeClient(props: {
  residentLabel: string;
  residenceTitle: string;
  basePath: string;
}) {
  const tiles = [
    {
      key: "camera",
      title: "Caméra",
      subtitle: "Voir le flux en direct",
      href: "camera",
      icon: "camera" as const,
    },
    {
      key: "chat",
      title: "Messages",
      subtitle: "Famille · résident · équipe",
      href: "chat",
      icon: "chat" as const,
    },
    {
      key: "alerts",
      title: "Alertes",
      subtitle: "Notifications importantes",
      href: "alerts",
      icon: "alerts" as const,
    },
    {
      key: "health",
      title: "État de santé",
      subtitle: "Résumé du jour",
      href: "health",
      icon: "health" as const,
    },
    {
      key: "services",
      title: "Services",
      subtitle: "Soins & repas",
      href: "services",
      icon: "services" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <header className="mb-10 border-b border-[#D4AF37]/18 pb-8">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#D4AF37]/75">Espace famille</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
          Suivez votre proche
        </h1>
        <p className="mt-4 text-[17px] text-white/55">
          <span className="text-white/85">{props.residentLabel}</span>
          <span className="text-white/35"> · </span>
          {props.residenceTitle}
        </p>
        <Link
          href={props.catalogHref}
          className="mt-6 inline-flex text-sm font-medium text-[#D4AF37] underline-offset-4 hover:underline"
        >
          Catalogue des résidences
        </Link>
      </header>

      <FamilyTileGrid tiles={tiles} basePath={props.basePath} />
    </div>
  );
}
