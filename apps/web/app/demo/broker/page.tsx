"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Shield, 
  Zap, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  Check,
  Video,
  FileText,
  Lock
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function BrokerDemoPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (ref && !tracked) {
      fetch('/api/demo/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref }),
      }).then(() => setTracked(true));
    }
  }, [ref, tracked]);

  const benefits = [
    {
      title: "Réduction des erreurs",
      desc: "Validation intelligente des clauses et formulaires OACIQ.",
      icon: <Shield className="w-5 h-5 text-[#D4AF37]" />
    },
    {
      title: "Rapidité d'exécution",
      desc: "Générez des offres complexes en moins de 5 minutes.",
      icon: <Zap className="w-5 h-5 text-blue-400" />
    },
    {
      title: "Conformité Québec",
      desc: "Système aligné sur les exigences de la Loi 25 et de l'OACIQ.",
      icon: <Lock className="w-5 h-5 text-green-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navbar Minimaliste */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center font-black text-black text-sm">L</div>
            <span className="font-bold tracking-tight">LECIPM <span className="text-[#D4AF37]">DEMO</span></span>
          </div>
          <Button 
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold h-9 text-xs rounded-full px-4"
            onClick={() => window.open('https://calendly.com/lecipm/demo', '_blank')}
          >
            Réserver ma démo
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
            Accès Courtier — Québec
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Découvrez le futur de la <br />
            <span className="text-[#D4AF37]">rédaction immobilière.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Regardez comment LECIPM sécurise vos transactions et automatise votre conformité en moins de 2 minutes.
          </p>
        </div>

        {/* Loom Video Embed Placeholder */}
        <div className="relative aspect-video rounded-2xl md:rounded-[32px] overflow-hidden border border-white/10 bg-black/60 shadow-2xl shadow-[#D4AF37]/5 group">
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors duration-500">
             {/* Replace this with real Loom embed code */}
             <div className="text-center space-y-4">
               <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#D4AF37]/20 group-hover:scale-110 transition-transform cursor-pointer">
                 <PlayIcon className="w-8 h-8 text-black fill-current" />
               </div>
               <p className="text-sm font-bold text-gray-300">Vidéo Démo (1:55 min)</p>
             </div>
          </div>
          {/* Real Loom Iframe example:
          <iframe 
            src="https://www.loom.com/embed/YOUR_VIDEO_ID" 
            frameBorder="0" 
            webkitallowfullscreen="true" 
            mozallowfullscreen="true" 
            allowFullScreen 
            className="absolute inset-0 w-full h-full"
          ></iframe>
          */}
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <Card key={i} className="p-6 bg-black/40 border-white/5 backdrop-blur-xl hover:border-[#D4AF37]/30 transition group">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/10 transition">
                {b.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-b from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-[40px] p-8 md:p-12 text-center space-y-8">
          <h2 className="text-3xl font-black">Prêt à transformer votre pratique ?</h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            Rejoignez les courtiers qui utilisent déjà LECIPM pour gagner du temps et réduire leurs risques juridiques.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button 
              className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black h-14 px-10 rounded-2xl text-lg shadow-lg shadow-[#D4AF37]/20"
              onClick={() => window.open('https://calendly.com/lecipm/demo', '_blank')}
            >
              Réserver ma démo de 10 min
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 italic">
              Zéro engagement. 100% concret.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="border-t border-white/5 py-12 bg-black/80">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Propulsé par le moteur de conformité LECIPM Québec</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="/legal/terms" className="hover:text-white transition">Conditions</a>
            <a href="/legal/privacy" className="hover:text-white transition">Confidentialité</a>
            <span>© 2026 LECIPM Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlayIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
    </svg>
  );
}
