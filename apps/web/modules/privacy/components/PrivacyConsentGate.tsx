"use client";

import React, { useState } from "react";
import { PrivacyPurpose } from "@prisma/client";

interface PrivacyConsentGateProps {
  userId: string;
  transactionId?: string;
  onSuccess: () => void;
  title?: string;
  purpose?: PrivacyPurpose;
}

export const PrivacyConsentGate: React.FC<PrivacyConsentGateProps> = ({
  userId,
  transactionId,
  onSuccess,
  title = "Privacy, Consent and Information Handling Acknowledgement",
  purpose = "TRANSACTION_EXECUTION",
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged || !legalName || !role) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          transactionId,
          purpose,
          legalName,
          role,
          acknowledged,
        }),
      });

      if (!res.ok) throw new Error("Failed to save consent");

      onSuccess();
    } catch (err) {
      setError("An error occurred while saving your consent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      <div className="prose prose-sm mb-6 text-gray-600 max-h-60 overflow-y-auto p-4 border border-gray-100 rounded bg-gray-50">
        <p>By signing this acknowledgement, you confirm and agree to the following:</p>
        <ul>
          <li><strong>Collection and Use:</strong> Personal information will be collected, used, communicated, stored, retained, and destroyed as needed for the transaction.</li>
          <li><strong>Limited Access:</strong> Access will be limited to people who need it for the file (brokers, agency staff, compliance officers).</li>
          <li><strong>Disclosure:</strong> Some information may be disclosed to third parties only for the purposes for which it was collected, or where the law allows/compels it (e.g., land register, financial institutions).</li>
          <li><strong>Protection:</strong> Sensitive information will be protected and may be redacted before wider dissemination.</li>
          <li><strong>Secondary Uses:</strong> Specific consent is required for secondary uses (marketing, prospecting, etc.).</li>
          <li><strong>Withdrawal:</strong> Consent can be withdrawn where legally possible, but this may affect some services.</li>
          <li><strong>Mandatory Gate:</strong> The transaction cannot start or continue unless this acknowledgement is signed.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acknowledge"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            required
          />
          <label htmlFor="acknowledge" className="text-sm font-medium text-gray-700">
            I have read and I accept the terms of the Privacy, Consent and Information Handling Acknowledgement.
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              id="legalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="As it appears on ID"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role in Transaction
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Select your role...</option>
              <option value="SELLER">Seller</option>
              <option value="BUYER">Buyer</option>
              <option value="TENANT">Tenant</option>
              <option value="LANDLORD">Landlord</option>
              <option value="BROKER">Broker</option>
              <option value="REPRESENTATIVE">Representative / Proxy</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Processing...' : 'Sign and Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};
