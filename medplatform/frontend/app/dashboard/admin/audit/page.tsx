"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { AuditLog } from "@/types";
import { ShieldCheck, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";

const ACTION_OPTIONS = [
  "ALL", "LOGIN", "LOGOUT", "RECORD_VIEW", "RECORD_CREATE",
  "VITALS_SUBMIT", "APPOINTMENT_CREATE", "ROLE_ASSIGN",
  "BREAK_GLASS_ACCESS", "UNAUTHORIZED_ATTEMPT",
];

const ACTION_COLORS: Record<string, string> = {
  LOGIN:                "bg-green-50 text-green-700",
  LOGOUT:               "bg-gray-50 text-gray-600",
  RECORD_VIEW:          "bg-blue-50 text-blue-700",
  RECORD_CREATE:        "bg-purple-50 text-purple-700",
  VITALS_SUBMIT:        "bg-cyan-50 text-cyan-700",
  APPOINTMENT_CREATE:   "bg-indigo-50 text-indigo-700",
  ROLE_ASSIGN:          "bg-yellow-50 text-yellow-700",
  BREAK_GLASS_ACCESS:   "bg-orange-50 text-orange-700",
  UNAUTHORIZED_ATTEMPT: "bg-red-50 text-red-700",
};

export default function AdminAuditPage() {
  const [logs, setLogs]   = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [action, setAction] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.getAuditLogs(page, action !== "ALL" ? action : undefined) as {
      data: AuditLog[]; total: number;
    };
    setLogs(res.data || []);
    setTotal(res.total || 0);
    setLoading(false);
  }, [page, action]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <ShieldCheck className="w-6 h-6 text-brand-600" />
        Compliance Audit Log
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Immutable record of all platform activity. Required under HIPAA §164.312(b) and Kenya DPA §41.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {ACTION_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => { setAction(a); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                action === a ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">{total} total events</div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Actor UUID</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No events found.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {format(new Date(l.created_at), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ACTION_COLORS[l.action] || "bg-gray-50 text-gray-600"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.actor_role || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{l.target_table || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {l.actor_id ? l.actor_id.slice(0, 12) + "…" : "anonymous"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{l.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                      {Object.keys(l.metadata).length > 0 ? JSON.stringify(l.metadata) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
