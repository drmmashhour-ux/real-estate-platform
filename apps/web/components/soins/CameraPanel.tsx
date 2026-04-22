"use client";

import type { ReactNode } from "react";

import { StatusBadge } from "@/components/soins/StatusBadge";
import type { SoinsUrgencyLevel } from "@/design-system/soins-hub";

export function CameraPanel(props: {
  title?: string;
  /** When false, stream area shows permission / setup message */
  canAccess: boolean;
  streamUrl?: string | null;
  statusLevel: SoinsUrgencyLevel;
  statusLabel: string;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#D4AF37]/18 bg-[#080808]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">{props.title ?? "Caméra"}</h2>
        <StatusBadge level={props.statusLevel} label={props.statusLabel} />
      </div>
      <div className="relative aspect-video w-full bg-black">
        {props.canAccess && props.streamUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- live stream; captions via vendor when available
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            src={props.streamUrl}
            aria-label="Flux vidéo en direct"
          />
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center text-white/55">
            <p className="text-lg text-white/80">
              {props.canAccess ? "Flux non disponible" : "Accès caméra non autorisé"}
            </p>
            <p className="max-w-md text-sm text-white/45">
              Votre proche ou l’établissement doit activer l’accès. Contactez l’équipe Soins si besoin.
            </p>
          </div>
        )}
      </div>
      {props.footer ? <div className="border-t border-white/10 px-4 py-3">{props.footer}</div> : null}
    </section>
  );
}
