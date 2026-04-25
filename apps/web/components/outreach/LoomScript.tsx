import React from 'react';
import { Card } from '../ui/Card';
import { Video, CheckCircle2, Mic, Zap, Clock } from 'lucide-react';

export const LoomScript: React.FC = () => {
  const steps = [
    { time: '0:00 – 0:10', text: '"Salut, je te montre rapidement comment un courtier peut créer et sécuriser une offre en quelques minutes avec LECIPM."' },
    { time: '0:10 – 0:30', text: '(show listing → click “Faire une offre”) "Ici, on part directement d’une propriété."' },
    { time: '0:30 – 1:00', text: '(show guided form) "Le formulaire est guidé, comme si un courtier assistait le client. On évite les oublis et les erreurs dès le départ."' },
    { time: '1:00 – 1:20', text: '(toggle “sans garantie”) "Si une décision risquée est prise, le système explique immédiatement les conséquences."' },
    { time: '1:20 – 1:40', text: '(click AI review) "L’IA analyse et propose des améliorations concrètes, sans modifier la structure légale."' },
    { time: '1:40 – 1:55', text: '(show compliance score + review screen) "On voit un score de conformité, les risques, et ce qui doit être corrigé."' },
    { time: '1:55 – 2:05', text: '(show finalize) "Une fois prêt, le document est généré avec un audit complet."' },
    { time: '2:05 – 2:15', text: '(close) "Si tu veux, je peux te montrer ça en 10 minutes avec un vrai cas."' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-[#D4AF37]" />
          Loom Demo Script (2 min)
        </h2>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          EST. 2:15
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Script Column */}
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition group">
              <span className="text-[10px] font-black text-[#D4AF37] whitespace-nowrap pt-1">{step.time}</span>
              <p className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition">{step.text}</p>
            </div>
          ))}
        </div>

        {/* Checklist Column */}
        <div className="space-y-4">
          <Card className="p-6 bg-[#D4AF37]/5 border-[#D4AF37]/20">
            <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recording Checklist
            </h3>
            <ul className="space-y-3">
              {[
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "Use real UI (no mock)" },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "Use short example (no typing delays)" },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "Zoom on key areas" },
                { icon: <Mic className="w-4 h-4 text-blue-400" />, text: "Speak clearly" },
                { icon: <Clock className="w-4 h-4 text-green-400" />, text: "Keep under 2 minutes" },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                  {item.icon}
                  {item.text}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-blue-500/5 border-blue-500/20">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider mb-2">Pro Tip</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Show the "Sans Garantie" toggle specifically. It's the #1 pain point for brokers regarding risk education for clients.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
