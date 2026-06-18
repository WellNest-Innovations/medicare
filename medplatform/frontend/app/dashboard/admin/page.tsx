"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { AuditLog } from "@/types";
import { ShieldCheck, Users, Activity, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminOverview() {
  const [logs, setLogs]   = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<{ id: string; role: string; full_name: string; is_active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [auditRes, userRes] = await Promise.all([
        adminApi.getAuditLogs(1) as Promise<{ data: AuditLog[]; total: number }>,
        adminApi.getUsers() as Promise<typeof users>,
      ]);
      setLogs(auditRes.data?.slice(0, 8) || []);
      setUsers(userRes);
      setLoading(false);
    }
    load();
  }, []);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const FLAG_COLORS: Record<string, string> = {
    NONE:               "bg-gray-50 text-gray-500",
    UNAUTHORIZED_ROLE:  "bg-red-50 text-red-700",
    BREAK_GLASS:        "bg-orange-50 text-orange-700",
    SENSITIVE_DATA_ACCESS: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform compliance and user management overview</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5 text-brand-600" />} label="Total Users" value={users.length} />
        <StatCard icon={<Activity className="w-5 h-5 text-green-600" />} label="Patients" value={roleCounts["PATIENT"] || 0} />
        <StatCard icon={<ShieldCheck className="w-5 h-5 text-purple-600" />} label="Doctors" value={roleCounts["DOCTOR"] || 0} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-500" />} label="Admins" value={roleCounts["ADMIN"] || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent audit logs */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              Recent Audit Events
            </h2>
            <Link href="/dashboard/admin/audit" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Table</th>
                    <th className="pb-2">Actor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                        {format(new Date(l.created_at), "MMM d, HH:mm")}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`badge ${FLAG_COLORS[l.action] || "bg-gray-50 text-gray-700"}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{l.actor_role || "—"}</td>
                      <td className="py-2 pr-4 text-gray-400">{l.target_table || "—"}</td>
                      <td className="py-2 text-gray-400 font-mono text-xs">
                        {l.actor_id ? l.actor_id.slice(0, 8) + "…" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}
