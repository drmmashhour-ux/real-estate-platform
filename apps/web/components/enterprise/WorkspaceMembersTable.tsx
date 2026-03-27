"use client";

type MemberRow = {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string | null; name: string | null };
};

export function WorkspaceMembersTable({ members }: { members: MemberRow[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-slate-500">No members yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.membershipId} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-100">{m.user.name || m.user.email || m.user.id}</div>
                {m.user.email ? <div className="text-xs text-slate-500">{m.user.email}</div> : null}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {m.role}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
