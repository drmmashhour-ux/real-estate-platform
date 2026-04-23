"use client";

import React, { useState, useEffect } from "react";

export function PrivacyDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [officer, setOfficer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/privacy/summary");
        const data = await res.json();
        setIncidents(data.incidents);
        setComplaints(data.complaints);
        setOfficer(data.officer);
      } catch (err) {
        console.error("Failed to fetch privacy summary", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading compliance dashboard...</div>;

  return (
    <div className="space-y-8 p-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Compliance</h1>
          <p className="text-gray-500 text-sm">Law 25 (Québec) and OACIQ monitoring</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
            Report Incident
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
            Manage Policies
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Privacy Officer</h3>
          {officer ? (
            <div>
              <p className="text-lg font-bold text-gray-900">{officer.name}</p>
              <p className="text-sm text-gray-600">{officer.title}</p>
              <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                ● Published
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500 font-medium italic">No officer published</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Complaints</h3>
          <p className="text-3xl font-bold text-gray-900">{complaints.filter(c => c.status === 'PENDING').length}</p>
          <p className="text-sm text-gray-500 mt-1">{complaints.length} total recorded</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Incidents</h3>
          <p className="text-3xl font-bold text-gray-900">{incidents.filter(i => !i.closedAt).length}</p>
          <p className="text-sm text-gray-500 mt-1">{incidents.filter(i => i.riskOfSeriousInjury).length} critical risk</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Confidentiality Incident Register (Law 25)</h2>
            <span className="text-xs text-gray-500">Immutable Log Active</span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serious Injury</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.length > 0 ? incidents.map((incident) => (
                <tr key={incident.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(incident.discoveredAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {incident.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      incident.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      incident.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {incident.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {incident.riskOfSeriousInjury ? 'YES' : 'NO'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {incident.closedAt ? 'Closed' : 'Open'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400 italic">
                    No incidents recorded in register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-900">Privacy Complaints</h2>
          </div>
          <div className="p-6">
            {complaints.length > 0 ? (
              <ul className="space-y-4">
                {complaints.map((complaint) => (
                  <li key={complaint.id} className="p-4 border border-gray-100 rounded-md flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{complaint.category}</h4>
                      <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                        <span>Due: {new Date(complaint.responseDueAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      complaint.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-gray-400 italic py-4">No complaints recorded.</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recent Privacy Audit Log</h2>
              <button className="text-xs text-blue-600 hover:underline">View All</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[300px]">
              <ul className="space-y-3">
                {/* Audit log entries would go here */}
                <li className="text-xs flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-700 font-medium">EXTERNAL_DISCLOSURE</span>
                  <span className="text-gray-400 italic">2 mins ago</span>
                </li>
                <li className="text-xs flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-700 font-medium">CONSENT_GRANTED</span>
                  <span className="text-gray-400 italic">1 hour ago</span>
                </li>
                <li className="text-xs flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-700 font-medium">INTERNAL_TRANSFER</span>
                  <span className="text-gray-400 italic">3 hours ago</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-900">Retention Policies</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Identity Information</span>
                  <span className="font-bold text-gray-900">7 Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Financial Information</span>
                  <span className="font-bold text-gray-900">7 Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Contact Information</span>
                  <span className="font-bold text-gray-900">3 Years</span>
                </div>
              </div>
              <button className="w-full mt-6 py-2 border border-gray-200 rounded text-xs font-bold text-gray-500 hover:bg-gray-50">
                EDIT RETENTION SCHEDULE
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
