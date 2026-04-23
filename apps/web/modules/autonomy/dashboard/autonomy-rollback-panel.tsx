"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { 
  RotateCcw, 
  History, 
  AlertCircle, 
  User, 
  Clock,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

type ReversibleAction = {
  id: string;
  actionType: string;
  domain: string;
  payload: any;
  executedAt: string;
};

export const AutonomyRollbackPanel: React.FC = () => {
  const [items, setItems] = useState<ReversibleAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReversibleAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/autonomy/reversible-actions");
      const data = await res.json();
      setItems(data.actions);
    } catch (error) {
      console.error("Failed to fetch reversible actions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleRollback = async () => {
    if (!selectedItem || !rollbackReason) return;

    try {
      const res = await fetch(`/api/autonomy/rollback/${selectedItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rollbackReason }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedItem(null);
        setRollbackReason("");
        fetchActions();
      }
    } catch (error) {
      console.error("Failed to perform rollback", error);
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-slate-800">Rollback Controls</h2>
        </div>
        <Badge variant="warning" className="bg-orange-50 text-orange-700 border-orange-100">
          Safe Actions Only
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-3 text-left">Action</th>
              <th className="px-6 py-3 text-left">Domain</th>
              <th className="px-6 py-3 text-left">Executed At</th>
              <th className="px-6 py-3 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  <Clock className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
                  Loading execution history...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No reversible actions found in recent history.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{item.actionType.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-indigo-600 border-indigo-100 uppercase text-[10px]">
                      {item.domain}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-400">
                      {format(new Date(item.executedAt), "MMM d, HH:mm:ss")}
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
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold"
                    >
                      Rollback
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
          title="Confirm Rollback"
        >
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-800">Reversing Autonomous Decision</p>
                <p className="text-sm text-orange-700 mt-1">
                  This will attempt to revert the changes made by the <span className="font-bold">{selectedItem.actionType}</span> action in the <span className="font-bold">{selectedItem.domain}</span> domain.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Action ID</span>
                <span className="font-mono text-slate-700">{selectedItem.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Original Execution</span>
                <span className="text-slate-700">{format(new Date(selectedItem.executedAt), "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">Original Change Payload</p>
              <pre className="bg-slate-50 text-slate-600 p-3 rounded-lg text-xs overflow-auto max-h-40 border border-slate-100">
                {JSON.stringify(selectedItem.payload, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">Reason for Rollback (Required)</p>
              <textarea 
                className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                placeholder="Why are you rolling back this action?"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
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
                variant="danger" 
                className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50"
                disabled={!rollbackReason}
                onClick={handleRollback}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> EXECUTE ROLLBACK
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
