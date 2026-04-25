import React from 'react';
import { Card } from '../ui/Card';
import { Target, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ClosingScript: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#D4AF37]" />
          Script de Closing (Activation)
        </h2>
      </div>

      <div className="space-y-4">
        {/* Phase 1: The Question */}
        <Card className="p-5 bg-white/5 border-white/10 hover:border-[#D4AF37]/30 transition">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-[#D4AF37]">01</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">La Question de Valeur</p>
              <p className="text-gray-200 italic leading-relaxed">
                "Tu as vu comment ça fonctionne. Maintenant la vraie question: est-ce que ça peut t’aider à gagner du temps ou sécuriser tes dossiers ?"
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">(ATTENDRE LA RÉPONSE)</p>
            </div>
          </div>
        </Card>

        {/* Phase 2: The Trial */}
        <Card className="p-5 bg-white/5 border-white/10 hover:border-[#D4AF37]/30 transition">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-[#D4AF37]">02</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Le Dossier Réel</p>
              <p className="text-gray-200 italic leading-relaxed">
                "Si oui: Je te propose qu'on l’utilise ensemble sur un vrai dossier cette semaine. On passe en 'Mode Assisté' et je te guide pour ton premier draft."
              </p>
            </div>
          </div>
        </Card>

        {/* Phase 3: Next Step */}
        <Card className="p-5 bg-[#D4AF37]/5 border-[#D4AF37]/20">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] mt-1" />
            <div>
              <p className="text-sm font-bold text-white">Objectif : Premier Succès</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Le but n'est pas de vendre l'outil aujourd'hui, mais de lui faire finaliser son premier document. Le paiement à l'usage ($15/doc) s'active naturellement après le premier succès.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
