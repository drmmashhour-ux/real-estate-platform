import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Play, CheckSquare, Clock, Video } from 'lucide-react';

export const LoomScript: React.FC = () => {
  const steps = [
    {
      time: '0:00 – 0:10',
      text: '"Salut, je te montre rapidement comment un courtier peut créer et sécuriser une offre en quelques minutes avec LECIPM."',
      action: 'Intro face-cam ou écran d\'accueil'
    },
    {
      time: '0:10 – 0:30',
      text: '"Ici, on part directement d’une propriété."',
      action: 'Montrer un listing → cliquer sur “Faire une offre”'
    },
    {
      time: '0:30 – 1:00',
      text: '"Le formulaire est guidé, comme si un courtier assistait le client. On évite les oublis et les erreurs dès le départ."',
      action: 'Parcourir le formulaire guidé rapidement'
    },
    {
      time: '1:00 – 1:20',
      text: '"Si une décision risquée est prise, le système explique immédiatement les conséquences."',
      action: 'Cocher “sans garantie légale” ou un risque similaire'
    },
    {
      time: '1:20 – 1:40',
      text: '"L’IA analyse et propose des améliorations concrètes, sans modifier la structure légale."',
      action: 'Cliquer sur AI Review / Validation'
    },
    {
      time: '1:40 – 1:55',
      text: '"On voit un score de conformité, les risques, et ce qui doit être corrigé."',
      action: 'Montrer le score de conformité + écran de révision'
    },
    {
      time: '1:55 – 2:05',
      text: '"Une fois prêt, le document est généré avec un audit complet."',
      action: 'Montrer la prévisualisation finale / export'
    },
    {
      time: '2:05 – 2:15',
      text: '"Si tu veux, je peux te montrer ça en 10 minutes avec un vrai cas."',
      action: 'Appel à l\'action final'
    }
  ];

  const checklist = [
    'Utiliser la vraie interface (pas de maquettes)',
    'Utiliser un exemple court (pas de délais de frappe)',
    'Zoomer sur les zones clés (Score, AI)',
    'Parler clairement et énergiquement',
    'Garder la vidéo sous les 2 minutes'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-[#D4AF37]" />
          Script Démo Loom (2 min)
        </h2>
        <div className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
          High Conversion Flow
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4 group">
            <div className="flex-shrink-0 w-24 pt-1">
              <span className="text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-1 rounded border border-[#D4AF37]/10">
                {step.time}
              </span>
            </div>
            <div className="flex-grow space-y-1">
              <p className="text-sm text-gray-200 leading-relaxed italic">
                {step.text}
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Play className="w-3 h-3" />
                Action: {step.action}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Recording Checklist
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checklist.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded-lg border border-white/5">
              <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
