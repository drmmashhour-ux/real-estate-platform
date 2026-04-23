"use client";

import React, { useState, useEffect } from "react";
import { PrivacyPurpose } from "@prisma/client";

interface TransactionPrivacyPanelProps {
  transactionId: string;
}

export function TransactionPrivacyPanel({ transactionId }: TransactionPrivacyPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrivacyData() {
      try {
        const res = await fetch(`/api/privacy/transaction/${transactionId}/summary`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch transaction privacy data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrivacyData();
  }, [transactionId]);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading privacy info...</div>;
  if (!data) return null;

  const { consents, accessLogs, transferLogs } = data;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-900">Privacy & Compliance Panel</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 rounded-full uppercase tracking-tighter">
          Law 25 Compliant
        </span>
      </div>
      
      <div className="p-4 space-y-6">
        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Consents & Gates</h4>
          <div className="space-y-2">
            {consents.length > 0 ? consents.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-blue-50 border border-blue-100 rounded">
                <div>
                  <p className="font-bold text-blue-900">{c.purpose.replace(/_/g, ' ')}</p>
                  <p className="text-blue-700 text-[10px]">{new Date(c.grantedAt).toLocaleString()}</p>
                </div>
                <span className="text-blue-600 font-bold">GRANTED</span>
              </div>
            )) : (
              <p className="text-xs text-red-500 italic font-medium p-2 bg-red-50 border border-red-100 rounded">
                No active consents found for this transaction.
              </p>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Access & Transfers</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] py-1">
              <span className="text-gray-500">Internal Transfers:</span>
              <span className="font-medium text-gray-900">{transferLogs.length} logged</span>
            </div>
            <div className="flex justify-between text-[11px] py-1">
              <span className="text-gray-500">External Disclosures:</span>
              <span className="font-medium text-gray-900">
                {accessLogs.filter((l: any) => l.action === 'EXTERNAL_DISCLOSURE').length} logged
              </span>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-[10px] font-bold hover:bg-gray-50">
              Audit Logs
            </button>
            <button className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-[10px] font-bold hover:bg-gray-50">
              Revoke Consents
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
