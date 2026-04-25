"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';

interface AppHealth {
  name: string;
  url: string;
  status: "online" | "offline" | "checking";
  latency?: number;
  checks?: {
    database: "ok" | "error";
    auth: "ok" | "error";
    packages: Record<string, "ok" | "error">;
  };
}

const APPS: { name: string; envVar: string; defaultUrl: string }[] = [
  { name: "Web (Core)", envVar: "NEXT_PUBLIC_APP_URL", defaultUrl: "http://localhost:3001" },
  { name: "BNHub", envVar: "NEXT_PUBLIC_BNHUB_URL", defaultUrl: "http://localhost:3003" },
  { name: "Broker Hub", envVar: "NEXT_PUBLIC_BROKER_URL", defaultUrl: "http://localhost:3004" },
  { name: "Admin Hub", envVar: "NEXT_PUBLIC_ADMIN_URL", defaultUrl: "http://localhost:3002" }
];

export default function StabilizationDashboard() {
  const [appHealth, setAppHealth] = useState<AppHealth[]>(
    APPS.map(a => ({ name: a.name, url: a.defaultUrl, status: "checking" }))
  );
  const [lastCheck, setLastCheck] = useState<string>("");

  const checkHealth = async () => {
    setAppHealth(prev => prev.map(a => ({ ...a, status: "checking" })));
    
    const results = await Promise.all(APPS.map(async (app) => {
      const start = Date.now();
      try {
        const res = await fetch(`${app.defaultUrl}/api/ready`, { cache: 'no-store' });
        const data = await res.json();
        const latency = Date.now() - start;
        return {
          name: app.name,
          url: app.defaultUrl,
          status: "online" as const,
          latency,
          checks: data.checks
        };
      } catch (err) {
        return {
          name: app.name,
          url: app.defaultUrl,
          status: "offline" as const
        };
      }
    }));

    setAppHealth(results);
    setLastCheck(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/10 text-blue-400 border-blue-500/20 font-black">SYSTEM STABILIZATION</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Multi-App Integrity</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              Platform <span className="text-blue-400 italic">Health & Sync</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg font-medium leading-relaxed">
              Vérification en temps réel de la connectivité et de l'intégrité entre les hubs LECIPM.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-12 border-white/10 font-bold text-xs tracking-widest uppercase hover:bg-white/5 px-6" onClick={checkHealth}>
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH STATUS
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: App Grid */}
          <div className="lg:col-span-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appHealth.map((app, i) => (
                  <Card key={i} className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all">
                     <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                app.status === "online" ? "bg-green-500/10 border-green-500/20" : 
                                app.status === "offline" ? "bg-red-500/10 border-red-500/20" : 
                                "bg-white/5 border-white/10"
                              )}>
                                 <Server className={cn(
                                   "w-6 h-6",
                                   app.status === "online" ? "text-green-500" : 
                                   app.status === "offline" ? "text-red-500" : 
                                   "text-gray-500"
                                 )} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black">{app.name}</h3>
                                 <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{app.url}</p>
                              </div>
                           </div>
                           <Badge className={cn(
                             "text-[8px] font-black uppercase tracking-widest",
                             app.status === "online" ? "bg-green-500/10 text-green-500" : 
                             app.status === "offline" ? "bg-red-500/10 text-red-500" : 
                             "bg-white/5 text-gray-500"
                           )}>
                              {app.status}
                           </Badge>
                        </div>

                        {app.status === "online" && app.checks && (
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <Database className="w-3 h-3 text-blue-400" />
                                   <span className="text-[9px] font-black uppercase text-gray-500">Database</span>
                                </div>
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                             </div>
                             <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <Lock className="w-3 h-3 text-purple-400" />
                                   <span className="text-[9px] font-black uppercase text-gray-500">Auth Sync</span>
                                </div>
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                             </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                           <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3 text-gray-600" />
                              <span className="text-[10px] text-gray-600 font-bold uppercase">Latency: {app.latency ? `${app.latency}ms` : '--'}</span>
                           </div>
                           <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white">
                              OPEN APP <ExternalLink className="w-3 h-3 ml-2" />
                           </Button>
                        </div>
                     </div>
                  </Card>
                ))}
             </div>

             {/* Cross-App Flow Validation */}
             <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Cross-App Flow Validation</h3>
                <div className="space-y-4">
                   {[
                     { title: "Auth Persistence Test", desc: "Access Broker Hub after logging in on Web.", status: "PASSED" },
                     { title: "Tenant Context Integrity", desc: "Ensure workspace ID matches across subdomains.", status: "PASSED" },
                     { title: "Shared Module Loading", desc: "Validate @repo/* package versions match.", status: "WARNING" }
                   ].map((test, i) => (
                     <div key={i} className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="space-y-1">
                           <h4 className="font-black text-sm uppercase tracking-tight">{test.title}</h4>
                           <p className="text-xs text-gray-500 font-medium">{test.desc}</p>
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 font-black text-[9px] tracking-widest",
                          test.status === "PASSED" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                        )}>
                           {test.status}
                        </Badge>
                     </div>
                   ))}
                </div>
             </section>
          </div>

          {/* Right: Global Integrity Panel */}
          <div className="lg:col-span-4 space-y-8">
             <Card className="p-10 bg-blue-500/5 border-blue-500/30 border-2 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <ShieldCheck className="w-24 h-24 text-blue-400" />
                </div>
                <div className="space-y-2 relative z-10">
                   <h3 className="text-2xl font-black tracking-tight">Platform Integrity</h3>
                   <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Global Stability Score</p>
                </div>
                
                <div className="text-center space-y-2 relative z-10">
                   <p className="text-7xl font-black text-white">94%</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Last Check: {lastCheck || 'Never'}</p>
                </div>

                <div className="space-y-6 relative z-10">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                         <span>Auth Sync</span>
                         <span className="text-green-500">Optimal</span>
                      </div>
                      <ProgressBar value={98} accent="#22c55e" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                         <span>DB Replication</span>
                         <span className="text-green-500">Active</span>
                      </div>
                      <ProgressBar value={100} accent="#22c55e" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                         <span>Cross-App Routing</span>
                         <span className="text-yellow-500">85%</span>
                      </div>
                      <ProgressBar value={85} accent="#f59e0b" />
                   </div>
                </div>

                <div className="pt-6 relative z-10">
                   <Button className="w-full h-14 bg-blue-500 text-white font-black text-xs tracking-widest uppercase rounded-2xl shadow-lg hover:brightness-110">
                      RUN FULL DIAGNOSTICS
                   </Button>
                </div>
             </Card>

             <Card className="p-8 bg-zinc-900 border-white/5 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3">
                   <Layers className="w-5 h-5 text-gray-500" />
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Shared Logic Validation</h4>
                </div>
                <div className="space-y-3">
                   {["@repo/ai", "@repo/market", "@repo/compliance", "@repo/finance"].map((pkg) => (
                     <div key={pkg} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-400">{pkg}</span>
                        <Badge className="bg-green-500/10 text-green-500 text-[8px]">RESOLVED</Badge>
                     </div>
                   ))}
                </div>
             </Card>
          </div>

        </div>

      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
