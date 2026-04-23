"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { 
  Power, 
  AlertOctagon, 
  Activity, 
  DollarSign, 
  Brain, 
  Zap, 
  PieChart, 
  Megaphone, 
  Lightbulb,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";

type AutonomyDomain = 
  | "pricing"
  | "learning"
  | "actions"
  | "portfolio_allocator"
  | "outbound_marketing"
  | "recommendations";

type DomainStatus = {
  domain: AutonomyDomain;
  isEnabled: boolean;
  reason?: string;
  changedBy?: string;
  changedAt?: string;
};

export const AutonomyKillSwitches: React.FC = () => {
  const [statuses, setStatuses] = useState<DomainStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<DomainStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleReason, setToggleReason] = useState("");

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/autonomy/kill-switches");
      const data = await res.json();
      setStatuses(data.statuses);
    } catch (error) {
      console.error("Failed to fetch domain statuses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleToggle = async () => {
    if (!selectedDomain || !toggleReason) return;

    try {
      const res = await fetch("/api/autonomy/kill-switches/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          domain: selectedDomain.domain, 
          isEnabled: !selectedDomain.isEnabled,
          reason: toggleReason
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedDomain(null);
        setToggleReason("");
        fetchStatuses();
      }
    } catch (error) {
      console.error("Failed to toggle kill switch", error);
    }
  };

  const getDomainIcon = (domain: AutonomyDomain) => {
    switch (domain) {
      case "pricing": return <DollarSign className="w-5 h-5" />;
      case "learning": return <Brain className="w-5 h-5" />;
      case "actions": return <Zap className="w-5 h-5" />;
      case "portfolio_allocator": return <PieChart className="w-5 h-5" />;
      case "outbound_marketing": return <Megaphone className="w-5 h-5" />;
      case "recommendations": return <Lightbulb className="w-5 h-5" />;
    }
  };

  const formatDomainName = (domain: string) => {
    return domain.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Power className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-slate-800">Domain Kill Switches</h2>
        </div>
        <Badge variant="danger" className="bg-red-50 text-red-700 border-red-100 font-bold">
          Emergency Overrides
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-slate-100">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Activity className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
            Synchronizing domain states...
          </div>
        ) : (
          statuses.map((status) => (
            <div key={status.domain} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${status.isEnabled ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"}`}>
                  {getDomainIcon(status.domain)}
                </div>
                <Toggle 
                  checked={status.isEnabled} 
                  onChange={() => {
                    setSelectedDomain(status);
                    setIsModalOpen(true);
                  }}
                  color={status.isEnabled ? "indigo" : "red"}
                />
              </div>
              
              <h3 className="font-bold text-slate-800 mb-1">{formatDomainName(status.domain)}</h3>
              <p className="text-xs text-slate-500 mb-3">
                {status.isEnabled 
                  ? "Active and executing autonomous logic." 
                  : "Emergency disabled. Manual only."}
              </p>

              {!status.isEnabled && (
                <div className="bg-red-50/50 border border-red-100 p-2 rounded-lg mb-2">
                  <p className="text-[10px] text-red-700 font-medium line-clamp-2">
                    <AlertOctagon className="w-3 h-3 inline mr-1" />
                    {status.reason || "No reason specified."}
                  </p>
                </div>
              )}

              {status.changedAt && (
                <p className="text-[10px] text-slate-400">
                  Last changed: {format(new Date(status.changedAt), "MMM d, HH:mm")}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {selectedDomain && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={selectedDomain.isEnabled ? "Emergency Kill Switch" : "Restore Domain Autonomy"}
        >
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border flex gap-3 ${selectedDomain.isEnabled ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
              {selectedDomain.isEnabled ? (
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              ) : (
                <Activity className="w-6 h-6 text-green-600 shrink-0" />
              )}
              <div>
                <p className={`text-sm font-bold ${selectedDomain.isEnabled ? "text-red-800" : "text-green-800"}`}>
                  {selectedDomain.isEnabled ? "Emergency Disablement" : "Re-enabling Domain"}
                </p>
                <p className={`text-sm mt-1 ${selectedDomain.isEnabled ? "text-red-700" : "text-green-700"}`}>
                  You are about to {selectedDomain.isEnabled ? "DISABLE" : "ENABLE"} autonomy for <span className="font-bold uppercase">{formatDomainName(selectedDomain.domain)}</span>.
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">Reason for change (Required)</p>
              <textarea 
                className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder={selectedDomain.isEnabled ? "Why are you disabling this domain?" : "Why is it safe to re-enable?"}
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1 py-4"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant={selectedDomain.isEnabled ? "danger" : "primary"}
                className={`flex-1 py-4 font-bold ${selectedDomain.isEnabled ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
                disabled={!toggleReason}
                onClick={handleToggle}
              >
                {selectedDomain.isEnabled ? "CONFIRM KILL SWITCH" : "CONFIRM RESTORE"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
