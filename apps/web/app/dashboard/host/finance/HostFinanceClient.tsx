"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  RefreshCw,
  Wallet,
  Calendar,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  bookingId?: string;
}

export function HostFinanceClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/host/finance");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayout(bookingId: string) {
    setPayoutLoading(bookingId);
    try {
      await fetch("/api/host/finance/payout", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      });
      loadData();
    } catch (err) {
      console.error("Payout trigger failed", err);
    } finally {
      setPayoutLoading(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-black min-h-screen">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 bg-zinc-800" />
          <Skeleton className="h-32 bg-zinc-800" />
        </div>
        <Skeleton className="h-[400px] w-full bg-zinc-800" />
      </div>
    );
  }

  const entries = data?.entries || [];
  const stats = data?.stats || { totalEarned: 0, pendingPayouts: 0 };
  
  // Heuristic: simulate pending payouts for bookings that haven't been paid out yet
  const pendingPayoutBookings = entries
    .filter((e: any) => e.type === "CHARGE" && !entries.some((p: any) => p.type === "PAYOUT" && p.bookingId === e.bookingId));

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Wallet className="w-8 h-8 text-emerald-500 fill-emerald-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Financial Hub
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Earnings, Payouts, and Transaction Integrity
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
          Sync
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Earned</p>
              <p className="text-3xl font-black text-white">${(stats.totalEarned / 100).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pending Payouts</p>
              <p className="text-3xl font-black text-white">${(stats.pendingPayouts / 100).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Payouts Action Block */}
      {pendingPayoutBookings.length > 0 && (
        <Card className="bg-zinc-900 border-orange-500/30 border-2 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-orange-500/5 flex justify-between items-center">
            <h3 className="font-bold text-white uppercase text-xs italic tracking-tighter flex items-center">
              <Zap className="w-4 h-4 text-orange-500 mr-2" />
              Available for Payout
            </h3>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[10px] font-black uppercase">
              Action Required
            </Badge>
          </div>
          <div className="divide-y divide-zinc-800">
            {pendingPayoutBookings.map((e: any) => (
              <div key={e.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                <div>
                  <p className="text-xs font-bold text-zinc-300 uppercase">Booking {e.bookingId?.slice(0, 8)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Payment received: {new Date(e.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-black text-white">${(e.amount * 0.9 / 100).toLocaleString()} (Net)</span>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest h-7"
                    onClick={() => handlePayout(e.bookingId)}
                    disabled={payoutLoading === e.bookingId}
                  >
                    {payoutLoading === e.bookingId ? "Processing..." : "Trigger Payout"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transaction List */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
          <h3 className="font-bold text-white uppercase text-xs italic tracking-tighter">Transaction History</h3>
          <Badge variant="outline" className="text-[10px] font-black uppercase text-zinc-500 border-zinc-800">Verified</Badge>
        </div>
        <div className="divide-y divide-zinc-800">
          {entries.map((e: LedgerEntry) => (
            <div key={e.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${e.type === "PAYOUT" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
                  {e.type === "PAYOUT" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">{e.type}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-[10px] text-zinc-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                    {e.bookingId && (
                      <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
                        BKG: {e.bookingId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">${(e.amount / 100).toLocaleString()}</p>
                <Badge variant="outline" className={`text-[9px] font-black uppercase h-4 px-1 mt-1 border-zinc-800 ${e.status === "SUCCEEDED" ? "text-emerald-500" : "text-yellow-500"}`}>
                  {e.status}
                </Badge>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="p-12 text-center text-zinc-600 italic text-sm">
              No financial activity recorded.
            </div>
          )}
        </div>
      </Card>

      <div className="pt-12 border-t border-zinc-900 opacity-20 italic">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
          BNHub Ledger Engine v2.0.1 — Non-Custodial Financial Integrity
        </p>
      </div>
    </div>
  );
}
