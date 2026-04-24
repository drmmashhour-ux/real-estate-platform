"use client";

import {
  buildClientProtectionNotice,
  getProtectionResourceBundle,
} from "@/lib/compliance/complaints/consumer-protection.service";

export function ConsumerProtectionPanel() {
  const bundle = getProtectionResourceBundle();
  const notice = buildClientProtectionNotice();

  return (
    <div className="rounded-xl border border-gray-800 bg-black p-4 text-white space-y-4">
      <h3 className="text-sm font-semibold text-[#D4AF37]">Consumer protection resources</h3>
      <p className="text-xs text-gray-400 whitespace-pre-line">{notice}</p>
      <ul className="space-y-3">
        {bundle.map((d) => (
          <li key={d.id} className="border border-gray-800 rounded-lg p-3 text-sm">
            <div className="font-medium text-gray-200">{d.labelEn}</div>
            <div className="text-xs text-gray-500 mt-1">{d.notesForUsersEn}</div>
            {d.officialUrl ? (
              <a
                href={d.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#D4AF37] mt-2 inline-block underline"
              >
                Official reference
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
