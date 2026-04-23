"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";

type PendingApproval = {
  id: string;
  domain: string;
  actionType: string;
  reason: string | null;
  riskLevel: string;
  proposedChange: any;
  createdAt: string;
};

export const AutonomyApprovalInbox: React.FC = () => {
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingApproval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/autonomy/approvals");
      const data = await res.json();
      setItems(data.approvals);
    } catch (error) {
      console.error("Failed to fetch approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/autonomy/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: actionReason }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedItem(null);
        setActionReason("");
        fetchApprovals();
      }
    } catch (error) {
      console.error(`Failed to ${action} action`, error);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case "HIGH":
        return <Badge variant="danger" className="bg-red-100 text-red-800 border-red-200">HIGH RISK</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" className="bg-orange-100 text-orange-800 border-orange-200">MEDIUM RISK</Badge>;
      default:
        return <Badge variant="info" className="bg-blue-100 text-blue-800 border-blue-200">LOW RISK</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Autonomy Approval Inbox</h2>
        </div>
        <Badge variant="outline" className="text-slate-500 font-medium">
          {items.length} Pending
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-3 text-left">Domain / Action</th>
              <th className="px-6 py-3 text-left">Risk</th>
              <th className="px-6 py-3 text-left">Reason</th>
              <th className="px-6 py-3 text-left">Created At</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Clock className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
                  Loading pending approvals...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No pending approvals. Autonomy is running smoothly.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-700 uppercase tracking-tight">{item.domain}</span>
                      <span className="text-sm text-slate-600 font-medium">{item.actionType.replace(/_/g, " ")}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRiskBadge(item.riskLevel)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-xs">
                      <p className="text-sm text-slate-500 line-clamp-2 italic">
                        "{item.reason || "No explicit reason provided"}"
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-400">
                      {format(new Date(item.createdAt), "MMM d, HH:mm")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold flex items-center gap-1 ml-auto"
                    >
                      Review <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {selectedItem && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Review Autonomous Action"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Domain</p>
                <p className="text-sm font-bold text-indigo-700">{selectedItem.domain}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Action Type</p>
                <p className="text-sm font-bold text-slate-700">{selectedItem.actionType}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Risk Level</p>
                {getRiskBadge(selectedItem.riskLevel)}
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Triggered At</p>
                <p className="text-sm text-slate-600 font-medium">{format(new Date(selectedItem.createdAt), "yyyy-MM-dd HH:mm:ss")}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-500" /> Rationale
              </p>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "{selectedItem.reason || "No explicit reason provided."}"
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Proposed Changes
              </p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-auto max-h-60 font-mono shadow-inner border border-slate-800">
                {JSON.stringify(selectedItem.proposedChange, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">Internal Note (Optional)</p>
              <textarea 
                className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Explain your decision..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="danger" 
                className="flex-1 py-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => handleAction(selectedItem.id, "reject")}
              >
                <XCircle className="w-5 h-5" /> REJECT ACTION
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 py-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => handleAction(selectedItem.id, "approve")}
              >
                <CheckCircle className="w-5 h-5" /> APPROVE ACTION
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
