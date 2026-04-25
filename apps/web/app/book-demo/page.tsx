"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

export default function BookDemoPage() {
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: '1-3',
    scheduledAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, refId }),
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Failed to book demo', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6 bg-black/40 border-[#D4AF37]/30 backdrop-blur-xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">C'est confirmé !</h1>
            <p className="text-gray-400">
              Votre démo est réservée. Vous allez recevoir un email de confirmation avec le lien de connexion.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/demo/broker">
              <Button className="w-full bg-[#D4AF37] text-black font-bold h-12 rounded-xl">
                Voir l'aperçu vidéo en attendant
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Side: Content */}
          <div className="space-y-8">
            <Link href="/demo/broker" className="inline-flex items-center text-sm text-gray-400 hover:text-[#D4AF37] transition">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la démo
            </Link>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Réserver une démo <br/>
                <span className="text-[#D4AF37]">(10 minutes)</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Découvrez comment réduire le temps sur les formulaires et sécuriser vos transactions avec l'intelligence de LECIPM.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { title: "Direct & Efficace", desc: "Pas de blabla. On vous montre le système en action.", icon: <Zap className="w-5 h-5" /> },
                { title: "Adapté à vous", desc: "On répond à vos questions sur vos types de dossiers.", icon: <Shield className="w-5 h-5" /> },
                { title: "Gratuit", desc: "Accès early-bird pour les courtiers du Québec.", icon: <Award className="w-5 h-5" /> }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <Card className="p-8 bg-black/60 border-white/10 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom Complet
                  </label>
                  <Input 
                    required
                    placeholder="Jean Tremblay"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="bg-white/5 border-white/10 h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <Input 
                      required
                      type="email"
                      placeholder="jean@agence.ca"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="bg-white/5 border-white/10 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    <Input 
                      required
                      placeholder="514-000-0000"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="bg-white/5 border-white/10 h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Ville
                    </label>
                    <Input 
                      required
                      placeholder="Montréal"
                      value={form.city}
                      onChange={e => setForm({...form, city: e.target.value})}
                      className="bg-white/5 border-white/10 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Expérience
                    </label>
                    <Select 
                      value={form.experience}
                      onChange={e => setForm({...form, experience: e.target.value})}
                      className="bg-white/5 border-white/10 h-12"
                    >
                      <option value="<1">Moins d'un an</option>
                      <option value="1-3">1 à 3 ans</option>
                      <option value="3-10">3 à 10 ans</option>
                      <option value="10+">Plus de 10 ans</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date souhaitée
                  </label>
                  <Input 
                    required
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={e => setForm({...form, scheduledAt: e.target.value})}
                    className="bg-white/5 border-white/10 h-12"
                    min={new Date().toISOString().split('T')[0] + 'T00:00'}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black h-14 rounded-2xl text-lg shadow-xl shadow-[#D4AF37]/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Traitement...' : 'Confirmer ma réservation'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">
                En réservant, vous acceptez d'être contacté pour cette démo.
              </p>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Zap(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function Award(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>; }
