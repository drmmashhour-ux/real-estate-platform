import React from 'react';
import { Card } from '../ui/Card';
import { MessageSquare, Phone, Clock, Shield } from 'lucide-react';

export const CallScriptPanel: React.FC = () => {
  const scripts = [
    {
      id: 'SCRIPT_A',
      title: 'FIRST CALL (30–45s)',
      icon: <Phone className="w-4 h-4" />,
      content: (
        <div className="space-y-4 text-sm">
          <p className="font-semibold text-blue-400 italic">"Salut [Prénom], je vais être direct."</p>
          <p>
            "On a construit une plateforme au Québec qui aide les courtiers à gagner du temps sur les formulaires et éviter les erreurs dans les offres."
          </p>
          <p className="font-medium">
            "Je voulais juste savoir: tu passes combien de temps par semaine sur la rédaction et validation des offres ?"
          </p>
          <p className="text-xs uppercase text-gray-500 font-bold">(LAISSER PARLER)</p>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <p>"On a un système qui automatise une partie de ça + ajoute une validation intelligente."</p>
            <p className="mt-2 font-bold text-[#D4AF37]">
              "Je peux te montrer en 10 minutes, c’est très concret. Tu serais dispo cette semaine ?"
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'SCRIPT_B',
      title: 'OBJECTION: “J’ai pas le temps”',
      icon: <Clock className="w-4 h-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"Je comprends totalement."</p>
          <p>
            "Justement, c’est pour ça que je t’appelle. La démo dure 10 minutes et si ça ne t’apporte rien, on arrête là."
          </p>
        </div>
      ),
    },
    {
      id: 'SCRIPT_C',
      title: 'OBJECTION: “J’ai déjà mes outils”',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"Parfait, tu es déjà structuré."</p>
          <p>
            "Nous, on ne remplace pas, on ajoute une couche: validation + réduction des erreurs + possibilité de leads."
          </p>
          <p>"C’est justement intéressant pour comparer."</p>
        </div>
      ),
    },
    {
      id: 'SCRIPT_D',
      title: 'CLOSE',
      icon: <MessageSquare className="w-4 h-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-blue-400 italic">"On prend seulement quelques courtiers en early access."</p>
          <p>
            "Je te propose: 10 minutes, tu vois le système, et tu décides après."
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
        Scripts de Vente Québec
      </h2>
      <div className="grid gap-4">
        {scripts.map((script) => (
          <Card key={script.id} className="p-0 overflow-hidden bg-black/60 border-white/10">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[#D4AF37]">
                {script.icon}
                {script.title}
              </h3>
            </div>
            <div className="p-4 text-gray-300 leading-relaxed">
              {script.content}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
