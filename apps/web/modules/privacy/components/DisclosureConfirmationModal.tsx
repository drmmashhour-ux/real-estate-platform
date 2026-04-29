"use client";

import React, { useState } from "react";
import type { PrivacyPurpose } from "@/types/privacy-purpose-client";

interface DisclosureConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  purpose: PrivacyPurpose;
  recipientName: string;
  dataSummary: string[];
}

export const DisclosureConfirmationModal: React.FC<DisclosureConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  purpose,
  recipientName,
  dataSummary,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Disclosure confirmation error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-orange-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">Confirm External Disclosure</h2>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to disclose personal information to <strong>{recipientName}</strong> for the purpose of: 
          <span className="block mt-1 font-semibold text-gray-800">{purpose.replace(/_/g, ' ')}</span>
        </p>

        <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data to be shared (Redacted):</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {dataSummary.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-blue-400 rounded-full"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
            <strong>Privacy Note:</strong> All sensitive fields (SIN, DOB, ID numbers) have been automatically redacted 
            in accordance with LECIPM Privacy Policy and OACIQ standards.
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Processing...' : 'Confirm and Disclose'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
