"use client";

import React, { useState } from "react";

export function PrivacyComplaintForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      category: formData.get("category"),
      description: formData.get("description"),
      transactionId: formData.get("transactionId"),
    };

    try {
      const res = await fetch("/api/privacy/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit complaint");
      setSubmitted(true);
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
        <h2 className="text-2xl font-bold text-green-900 mb-2">Complaint Submitted</h2>
        <p className="text-green-800">
          Thank you for bringing this to our attention. Our Privacy Officer will review your complaint
          and respond within 30 days.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-green-900 underline"
        >
          Submit another complaint
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Complaint Form</h2>
      <p className="text-gray-600 mb-8 text-sm">
        Use this form to report a concern about how your personal information is handled. 
        Your complaint will be sent directly to our Privacy Officer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="name" name="name" required className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" id="email" name="email" required className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category of Concern</label>
          <select id="category" name="category" required className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select a category...</option>
            <option value="UNAUTHORIZED_ACCESS">Unauthorized access to my data</option>
            <option value="UNAUTHORIZED_DISCLOSURE">Unauthorized disclosure to third parties</option>
            <option value="DATA_INACCURACY">Inaccurate personal information</option>
            <option value="RETENTION_ISSUE">Data kept longer than necessary</option>
            <option value="CONSENT_VIOLATION">Use of data without my consent</option>
            <option value="OTHER">Other privacy concern</option>
          </select>
        </div>

        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
          <input type="text" id="transactionId" name="transactionId" className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. TX-2026-001" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description of the Incident/Concern</label>
          <textarea id="description" name="description" rows={5} required className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Please provide details about your concern..."></textarea>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 bg-blue-600 text-white rounded-md font-bold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
}
