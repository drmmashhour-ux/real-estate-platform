"use client";

import React, { useState, useEffect } from "react";
import type { PrivacyPurpose } from "@/types/privacy-purpose-client";

interface TransactionPrivacyPanelProps {
  transactionId: string;
}

export function TransactionPrivacyPanel({ transactionId }: TransactionPrivacyPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrivacyData() {
      try {
        const res = await fetch(`/api/privacy/transaction-status?transactionId=${transactionId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch transaction privacy status", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrivacyData();
  }, [transactionId]);

  if (loading) return <div className="p-4 text-center text-gray-500 text-sm">Loading privacy status...</div>;
  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Privacy & Access Status</h3>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Acknowledgement</h4>
          {data.acknowledgement ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Signed by {data.acknowledgement.metadata?.role} on {new Date(data.acknowledgement.signedAt).toLocaleDateString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>Acknowledgement Required</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Active Disclosures</h4>
          <ul className="space-y-2">
            {data.disclosures.map((d: any, idx: number) => (
              <li key={idx} className="text-xs flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="font-medium text-gray-700">{d.recipientName}</span>
                <span className="text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {data.disclosures.length === 0 && <li className="text-xs text-gray-400 italic">No external disclosures recorded</li>}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Access Log (Recent)</h4>
          <ul className="space-y-1">
            {data.accessLogs.map((log: any, idx: number) => (
              <li key={idx} className="text-[10px] text-gray-500 flex justify-between border-b border-gray-100 pb-1">
                <span>{log.action}</span>
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between">
        <span>File ID: {transactionId.slice(0, 8)}...</span>
        <span>Law 25 Compliant</span>
      </div>
    </div>
  );
}
