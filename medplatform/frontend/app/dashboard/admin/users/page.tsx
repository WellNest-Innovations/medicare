"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { AuditLog } from "@/types";
import { ShieldCheck, Users, Activity, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminOverview() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<
    { id: string; role: string; full_name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [auditRes, userRes] = await Promise.all([
        adminApi.getAuditLogs(1) as Promise<{
          data: AuditLog[];
          total: number;
        }>,
        adminApi.getUsers() as Promise<typeof users>,
      ]);
      setLogs(auditRes.data?.slice(0, 10) || []);
      setUsers(userRes);
      setLoading(false);
    }
    load();
  }, []);

  const counts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ACTION_STYLES: Record<string, string> = {
    BREAK_GLASS_ACCESS: "badge-red",
    UNAUTHORIZED_ATTEMPT: "badge-red",
    ROLE_ASSIGN: "badge-amber",
    RECORD_VIEW: "badge-blue",
    RECORD_CREATE: "badge-blue",
    LOGIN: "badge-green",
  };

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "960px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Admin Dashboard
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.83rem",
            marginTop: "0.25rem",
          }}
        >
          Platform compliance and access overview
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.875rem",
          marginBottom: "1.75rem",
        }}
      >
        {[
          {
            icon: <Users size={16} color="var(--accent-blue)" />,
            label: "Total Users",
            value: users.length,
            color: "var(--accent-blue)",
          },
          {
            icon: <Activity size={16} color="var(--accent-green)" />,
            label: "Patients",
            value: counts["PATIENT"] || 0,
            color: "var(--accent-green)",
          },
          {
            icon: <ShieldCheck size={16} color="var(--accent-teal)" />,
            label: "Doctors",
            value: counts["DOCTOR"] || 0,
            color: "var(--accent-teal)",
          },
          {
            icon: <AlertTriangle size={16} color="var(--accent-amber)" />,
            label: "CHVs",
            value: counts["CHV"] || 0,
            color: "var(--accent-amber)",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              style={{
                width: "32px",
                height: "32px",
                background: `${s.color}18`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.5rem",
              }}
            >
              {s.icon}
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent audit events */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.83rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            RECENT AUDIT EVENTS
          </span>
          <Link
            href="/dashboard/admin/audit"
            style={{
              fontSize: "0.75rem",
              color: "var(--accent-green)",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Role</th>
                <th>Table</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {format(new Date(l.created_at), "d MMM, HH:mm")}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        ACTION_STYLES[l.action] || "badge-muted"
                      }`}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td
                    style={{
                      fontSize: "0.83rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {l.actor_role || "—"}
                  </td>
                  <td
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    {l.target_table || "—"}
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {l.actor_id ? l.actor_id.slice(0, 10) + "…" : "anon"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
