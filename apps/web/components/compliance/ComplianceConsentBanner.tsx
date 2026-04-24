"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Check, X, Loader2 } from "lucide-react";

export function ComplianceConsentBanner({ 
  consentType, 
  title, 
  description,
  onGranted 
}: { 
  consentType: string; 
  title: string; 
  description: string;
  onGranted?: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "missing" | "granted">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  async function checkConsent() {
    try {
      const res = await fetch("/api/compliance/consent");
      const data = await res.json();
      const match = data.consents.find((c: any) => c.consentType === consentType);
      if (match?.granted) {
        setStatus("granted");
      } else {
        setStatus("missing");
      }
    } catch (e) {
      console.error("Failed to check consent", e);
      setStatus("missing");
    }
  }

  async function handleGrant() {
    setProcessing(true);
    try {
      await fetch("/api/compliance/consent", {
        method: "POST",
        body: JSON.stringify({ consentType, granted: true }),
      });
      setStatus("granted");
      onGranted?.();
    } catch (e) {
      console.error("Failed to grant consent", e);
    } finally {
      setProcessing(false);
    }
  }

  if (status === "loading" || status === "granted") return null;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-600 max-w-xl">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs h-8 border-slate-200"
          onClick={() => setStatus("loading")} // Hide for this session if dismissed
        >
          Later
        </Button>
        <Button 
          size="sm" 
          className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleGrant}
          disabled={processing}
        >
          {processing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
          Enable & Continue
        </Button>
      </div>
    </div>
  );
}
