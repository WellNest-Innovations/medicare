"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface User { id: string; full_name: string; role: string; is_active: boolean; created_at: string; }

export default function AdminUsersPage() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  async function load() {
    const data = await adminApi.getUsers() as User[];
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      await adminApi.assignRole(userId, newRole);
      setSuccess(userId);
      setTimeout(() => setSuccess(null), 2000);
      load();
    } finally {
      setUpdating(null);
    }
  }

  const ROLE_COLORS: Record<string, string> = {
    PATIENT: "bg-blue-50 text-blue-700",
    DOCTOR:  "bg-green-50 text-green-700",
    ADMIN:   "bg-purple-50 text-purple-700",
  };

  const filtered = filter === "ALL" ? users : users.filter((u) => u.role === filter);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-brand-600" />
        User Management
      </h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PATIENT", "DOCTOR", "ADMIN"].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === r ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {r} {r === "ALL" ? `(${users.length})` : `(${users.filter((u) => u.role === r).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading users…</p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Current Role</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                        {u.full_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 12)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {format(new Date(u.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {success === u.id ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Updated
                      </span>
                    ) : (
                      <select
                        className="input py-1 text-xs w-32"
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="PATIENT">PATIENT</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
