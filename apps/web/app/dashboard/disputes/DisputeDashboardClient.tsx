"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText,
  Gavel,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Dispute {
  id: string;
  status: string;
  claimant: string;
  description: string;
  createdAt: string;
  booking: { confirmationCode: string };
  listing: { title: string };
}

export function DisputeDashboardClient() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/disputes");
      const json = await res.json();
      setDisputes(json.disputes || []);
    } catch (err) {
      console.error("Failed to load disputes", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    if (status.startsWith("RESOLVED")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (status === "REJECTED") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (status === "SUBMITTED") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-black min-h-screen">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-800" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Gavel className="w-8 h-8 text-orange-500 fill-orange-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Dispute Center
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Conflict Resolution and Platform Fairness Interface
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={loading}
          className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {disputes.map((d) => (
          <Card key={d.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-[10px] font-black uppercase ${getStatusColor(d.status)}`}>
                      {d.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                      ID: {d.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">
                  {d.claimant} Complaint: {d.listing.title}
                </h3>
                
                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 font-medium italic">
                  "{d.description}"
                </p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-500 uppercase font-black">
                    <FileText className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Booking: {d.booking.confirmationCode}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-500 uppercase font-black">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-700" />
                    <span>0 Messages</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 p-5 md:w-64 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col justify-center space-y-2">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest h-8">
                  View Case
                </Button>
                <Button variant="outline" size="sm" className="w-full bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest h-8">
                  Collect Evidence
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {disputes.length === 0 && (
          <Card className="p-12 border-dashed border-zinc-800 bg-transparent flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-zinc-900 mb-4">
              <CheckCircle2 className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-bold uppercase tracking-tight">All Quiet</h3>
            <p className="text-zinc-600 text-xs mt-1 italic">No active disputes requiring attention.</p>
          </Card>
        )}
      </div>

      <div className="pt-12 border-t border-zinc-900 opacity-20 italic">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
          Dispute Resolution Engine v1.1.2 — Decentralized Fairness Protocol
        </p>
      </div>
    </div>
  );
}
