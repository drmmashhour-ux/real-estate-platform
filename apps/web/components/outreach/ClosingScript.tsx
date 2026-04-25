import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Target, XCircle, CheckCircle, HelpCircle } from 'lucide-react';

export const ClosingScript: React.FC = () => {
  const scripts = [
    {
      id: 'CLOSE_TRIAL',
      title: 'PROPOSER UN ESSAI (CAS RÉEL)',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"Tu as vu comment ça fonctionne. Maintenant la vraie question: est-ce que ça peut t’aider à gagner du temps ou sécuriser tes dossiers ?"</p>
          <p className="text-xs uppercase text-gray-500 font-bold">(ATTENDRE LA RÉPONSE)</p>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <p className="font-bold text-[#D4AF37]">"Je te propose: on l’utilise ensemble sur un vrai dossier cette semaine."</p>
          </div>
        </div>
      ),
    },
    {
      id: 'CLOSE_A',
      title: 'DÉMO → ACTIVATION',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"On prend seulement quelques courtiers en early access par secteur."</p>
          <p>
            "Je te propose d'activer ton accès aujourd'hui. Tu peux créer ton premier draft gratuitement pour voir comment le système réagit à ton dossier actuel."
          </p>
          <p className="font-bold text-[#D4AF37]">"Tu veux qu'on configure ton profil ensemble ?"</p>
        </div>
      ),
    },
    {
      id: 'CLOSE_B',
      title: 'GÉRER LE PRIX',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"C'est un investissement dans ta tranquillité d'esprit."</p>
          <p>
            "Une seule erreur évitée ou un seul oubli sur une promesse d'achat et le système est rentabilisé pour l'année complète."
          </p>
        </div>
      ),
    },
    {
      id: 'CLOSE_C',
      title: 'SÉCURITÉ LOI 25',
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"On s'occupe de la traçabilité pour toi."</p>
          <p>
            "Chaque clic, chaque consentement et chaque validation est archivé selon les standards du Québec. Tu n'as plus à te soucier de l'audit de tes données."
          </p>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-[#D4AF37]" />
        Techniques de Closing
      </h2>
      <div className="grid gap-4">
        {scripts.map((script) => (
          <div key={script.id} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">{script.title}</h3>
            </div>
            <div className="p-4 text-gray-300">
              {script.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
