"use client";

import React, { useState } from "react";

export function PrivacyComplaintForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "ACCESS_REQUEST",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/privacy/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit complaint");

      setSuccess(true);
    } catch (err) {
      setError("An error occurred while submitting your complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Complaint Submitted Successfully</h3>
        <p>Your request has been received by our Privacy Officer. We will respond within 30 days.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold mb-4">Privacy Complaint / Request Form</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
          >
            <option value="ACCESS_REQUEST">Access Request (Law 25)</option>
            <option value="CORRECTION_REQUEST">Correction of Information</option>
            <option value="CONSENT_WITHDRAWAL">Withdrawal of Consent</option>
            <option value="DATA_DELETION">Right to be Forgotten</option>
            <option value="SECURITY_CONCERN">Privacy / Security Breach Concern</option>
            <option value="OTHER">Other Complaint</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description of Request/Complaint</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder="Please provide as much detail as possible..."
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
