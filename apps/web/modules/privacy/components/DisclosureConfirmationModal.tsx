"use client";

import React, { useState } from "react";

interface DisclosureConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (purpose: string, redact: boolean) => void;
  fileName: string;
  recipient: string;
}

export const DisclosureConfirmationModal: React.FC<DisclosureConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  recipient,
}) => {
  const [purpose, setPurpose] = useState("");
  const [redact, setRedact] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Confirm External Disclosure
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You are about to share <strong>{fileName}</strong> with <strong>{recipient}</strong>. 
                  Law 25 and OACIQ rules require that disclosure be limited to the minimum necessary for the specified purpose.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="disclosure-purpose" className="block text-sm font-medium text-gray-700">
                Purpose of Disclosure
              </label>
              <select
                id="disclosure-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a purpose...</option>
                <option value="OFFER_SUBMISSION">Offer Submission / Negotiation</option>
                <option value="DUE_DILIGENCE">Due Diligence (Inspection, Finance)</option>
                <option value="CENTRIS_UPLOAD">Information Dissemination Service (Centris)</option>
                <option value="LEGAL_COMPLIANCE">Legal or Regulatory Requirement</option>
                <option value="CLIENT_AUTHORIZATION">Explicit Client Authorization</option>
              </select>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="redact-sensitive"
                  type="checkbox"
                  checked={redact}
                  onChange={(e) => setRedact(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="redact-sensitive" className="font-medium text-gray-700">Apply automatic redaction</label>
                <p className="text-gray-500">Removes ID numbers, DOB, and non-essential contact info from the shared copy.</p>
              </div>
            </div>

            {redact === false && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                <strong>Warning:</strong> Disclosing unredacted personal information without a strict legal basis or explicit written consent may violate Law 25.
              </div>
            )}
          </div>

          <div className="mt-8 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={!purpose}
              onClick={() => onConfirm(purpose, redact)}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${!purpose ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Confirm and Disclose
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
