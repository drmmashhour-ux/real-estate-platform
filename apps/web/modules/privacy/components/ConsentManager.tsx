"use client";

import React, { useState, useEffect } from "react";
import { PrivacyPurpose } from "@prisma/client";

interface ConsentManagerProps {
  userId: string;
}

export function ConsentManager({ userId }: ConsentManagerProps) {
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConsents() {
      try {
        const res = await fetch(`/api/privacy/consents?userId=${userId}`);
        const data = await res.json();
        setConsents(data.consents);
      } catch (err) {
        console.error("Failed to fetch consents", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConsents();
  }, [userId]);

  const handleToggle = async (purpose: PrivacyPurpose, currentlyGranted: boolean) => {
    try {
      const res = await fetch("/api/privacy/consent/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose, granted: !currentlyGranted }),
      });
      if (res.ok) {
        // Refresh consents
        const data = await res.json();
        setConsents(prev => prev.map(c => c.purpose === purpose ? { ...c, granted: !currentlyGranted } : c));
      }
    } catch (err) {
      console.error("Failed to toggle consent", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your privacy settings...</div>;

  const purposes = [
    { key: "MARKETING", label: "Marketing Communications", description: "Receive newsletters, property alerts, and promotional offers." },
    { key: "COMMERCIAL_PROSPECTING", label: "Commercial Prospecting", description: "Allow brokers to contact you for potential opportunities." },
    { key: "SECONDARY_USE", label: "Secondary Use of Data", description: "Allow us to use your data for research and platform improvement." },
    { key: "PHONE_DISCLOSURE_FOR_VISIT", label: "Phone Disclosure for Visits", description: "Share your phone number with brokers for visit coordination." },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Your Privacy Consents</h2>
        <p className="text-sm text-gray-500">Manage how your personal information is used for secondary purposes.</p>
      </div>
      <div className="divide-y divide-gray-200">
        {purposes.map((p) => {
          const consent = consents.find(c => c.purpose === p.key && !c.revokedAt);
          const isGranted = consent?.granted ?? false;
          
          return (
            <div key={p.key} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{p.label}</h4>
                <p className="text-xs text-gray-500 max-w-md">{p.description}</p>
              </div>
              <button
                onClick={() => handleToggle(p.key as PrivacyPurpose, isGranted)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isGranted ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isGranted ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 italic">
          Note: Mandatory consents for transaction execution cannot be toggled here and are managed per transaction.
        </p>
      </div>
    </div>
  );
}
