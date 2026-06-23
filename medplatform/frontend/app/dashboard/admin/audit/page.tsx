"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { AuditLog } from "@/types";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const ACTION_STYLES: Record<string, string> = {
  LOGIN: "badge-green",
  LOGOUT: "badge-muted",
  RECORD_VIEW: "badge-blue",
  RECORD_CREATE: "badge-blue",
  VITALS_SUBMIT: "badge-green",
  APPOINTMENT_CREATE: "badge-blue",
  ROLE_ASSIGN: "badge-amber",
  BREAK_GLASS_ACCESS: "badge-red",
  UNAUTHORIZED_ATTEMPT: "badge-red",
};

const ACTIONS = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "RECORD_VIEW",
  "RECORD_CREATE",
  "VITALS_SUBMIT",
  "APPOINTMENT_CREATE",
  "ROLE_ASSIGN",
  "BREAK_GLASS_ACCESS",
  "UNAUTHORIZED_ATTEMPT",
];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = (await adminApi.getAuditLogs(
      page,
      action !== "ALL" ? action : undefined,
    )) as { data: AuditLog[]; total: number };
    setLogs(res.data || []);
    setTotal(res.total || 0);
    setLoading(false);
  }, [page, action]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div style={{ padding: "1.75rem 2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <ShieldCheck size={20} color="var(--accent-green)" />
          Compliance Audit Log
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            marginTop: "0.25rem",
          }}
        >
          Immutable record of all platform activity · HIPAA §164.312(b) · Kenya
          DPA §41
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        {ACTIONS.map((a) => (
          <button
            key={a}
            onClick={() => {
              setAction(a);
              setPage(1);
            }}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "99px",
              fontSize: "0.72rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid",
              background: action === a ? "var(--accent-green)" : "transparent",
              color:
                action === a ? "var(--text-inverse)" : "var(--text-secondary)",
              borderColor:
                action === a ? "var(--accent-green)" : "var(--border-strong)",
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginBottom: "0.75rem",
        }}
      >
        {total} total events
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Role</th>
                <th>Table</th>
                <th>Actor UUID</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "2.5rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div className="spinner" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "2.5rem",
                      color: "var(--text-muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    No events found
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {format(new Date(l.created_at), "d MMM, HH:mm:ss")}
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
                        color: "var(--text-secondary)",
                        fontSize: "0.83rem",
                      }}
                    >
                      {l.actor_role || "—"}
                    </td>
                    <td
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {l.target_table || "—"}
                    </td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {l.actor_id ? l.actor_id.slice(0, 12) + "…" : "anon"}
                    </td>
                    <td
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {l.ip_address || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div
            style={{
              padding: "0.875rem 1rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              <button
                className="btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
