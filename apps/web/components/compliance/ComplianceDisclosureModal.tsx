"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

interface Disclosure {
  id: string;
  context: string;
  message: string;
  version: string;
}

export function ComplianceDisclosureModal({ 
  context, 
  isOpen, 
  onAccepted,
  onClose 
}: { 
  context: string; 
  isOpen: boolean; 
  onAccepted: () => void;
  onClose: () => void;
}) {
  const [disclosure, setDisclosure] = useState<Disclosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDisclosures();
    }
  }, [isOpen]);

  async function fetchDisclosures() {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/disclosures");
      const data = await res.json();
      const match = data.disclosures.find((d: any) => d.context === context);
      if (match && !match.accepted) {
        setDisclosure(match.disclosure);
      } else if (match && match.accepted) {
        onAccepted();
      }
    } catch (e) {
      console.error("Failed to fetch disclosures", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!disclosure) return;
    setAccepting(true);
    try {
      await fetch("/api/compliance/disclosures", {
        method: "POST",
        body: JSON.stringify({ disclosureId: disclosure.id }),
      });
      onAccepted();
    } catch (e) {
      console.error("Failed to accept disclosure", e);
    } finally {
      setAccepting(false);
    }
  }

  if (!isOpen || (!loading && !disclosure)) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <DialogTitle>Regulatory Disclosure</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Please review and acknowledge the following disclosure to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Legal Notice (v{disclosure?.version})</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {disclosure?.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end mt-4">
          <Button variant="ghost" onClick={onClose} disabled={accepting}>Cancel</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleAccept} 
            disabled={loading || accepting}
          >
            {accepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            I Acknowledge & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
