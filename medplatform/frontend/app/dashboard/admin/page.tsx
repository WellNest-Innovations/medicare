"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AuditLog } from "@/types";
import {
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminOverview() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<
    { id: string; role: string; full_name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);

  // Assignment form state
  const [assignType, setAssignType] = useState<"doctor" | "chv">("chv");
  const [doctorId, setDoctorId] = useState("");
  const [chvId, setChvId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

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

  const doctors = users.filter((u) => u.role === "DOCTOR");
  const chvs = users.filter((u) => u.role === "CHV");
  const patients = users.filter((u) => u.role === "PATIENT");

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setAssigning(true);
    setAssignError("");
    setAssignSuccess("");
    try {
      if (assignType === "doctor") {
        await adminApi.assignDoctor(doctorId, patientId);
        setAssignSuccess(`Doctor assigned to patient successfully.`);
      } else {
        // CHV assignment via Supabase directly
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`${API_URL}/admin/chv-assignments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chv_id: chvId, patient_id: patientId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to assign");
        }
        setAssignSuccess(`CHV assigned to patient successfully.`);
      }
      setDoctorId("");
      setChvId("");
      setPatientId("");
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  }

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
        }}
      >
        <div>
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
        <button
          className="btn-secondary"
          style={{ fontSize: "0.83rem" }}
          onClick={() => setShowAssign(true)}
        >
          <Plus size={14} />
          Assign Provider
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
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

      {/* Assignment modal */}
      {showAssign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Assign Provider to Patient
              </h2>
              <button
                onClick={() => {
                  setShowAssign(false);
                  setAssignSuccess("");
                  setAssignError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleAssign}
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Assignment type toggle */}
              <div
                style={{
                  display: "flex",
                  background: "var(--surface-raised)",
                  borderRadius: "10px",
                  padding: "4px",
                  gap: "4px",
                }}
              >
                {(["doctor", "chv"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAssignType(t)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      background:
                        assignType === t
                          ? "var(--surface-card)"
                          : "transparent",
                      color:
                        assignType === t
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    Assign {t === "doctor" ? "Doctor" : "CHV"}
                  </button>
                ))}
              </div>

              {assignType === "doctor" ? (
                <div>
                  <label className="label">Doctor</label>
                  <select
                    className="input"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    required
                  >
                    <option value="">Select doctor…</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label">CHV</label>
                  <select
                    className="input"
                    value={chvId}
                    onChange={(e) => setChvId(e.target.value)}
                    required
                  >
                    <option value="">Select CHV…</option>
                    {chvs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Patient</label>
                <select
                  className="input"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {assignError && (
                <div className="alert-error" style={{ fontSize: "0.8rem" }}>
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div className="alert-success" style={{ fontSize: "0.8rem" }}>
                  {assignSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={assigning}
                  style={{ flex: 1 }}
                >
                  {assigning ? "Assigning…" : "Confirm Assignment"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssign(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent audit events */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
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
