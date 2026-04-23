import React from "react";
import { prisma } from "@/lib/db";

export async function PrivacyOfficerInfo() {
  const officer = await prisma.privacyOfficer.findFirst({
    where: { published: true },
  });

  if (!officer) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
        <p className="font-medium">Privacy Officer information is not yet published.</p>
        <p className="text-sm">Please contact <a href="mailto:info@lecipm.com" className="underline">info@lecipm.com</a> for any privacy inquiries.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Privacy Officer</h3>
      <div className="space-y-1 text-sm text-gray-700">
        <p><span className="font-semibold">Name:</span> {officer.name}</p>
        <p><span className="font-semibold">Title:</span> {officer.title}</p>
        <p><span className="font-semibold">Email:</span> <a href={`mailto:${officer.email}`} className="text-blue-600 hover:underline">{officer.email}</a></p>
        {officer.phone && <p><span className="font-semibold">Phone:</span> {officer.phone}</p>}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-semibold mb-1 text-sm">Complaint Handling Procedure</h4>
        <p className="text-sm text-gray-600">
          Any complaint regarding the protection of personal information should be sent to the Privacy Officer at the email address provided above.
          We will acknowledge receipt of your complaint and provide a response within 30 days.
        </p>
      </div>
    </div>
  );
}
