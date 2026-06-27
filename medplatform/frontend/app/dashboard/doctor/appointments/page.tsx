"use client";
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Appointment, Profile } from "@/types";
import {
  Calendar,
  Clock,
  MapPin,
  FileEdit,
  CheckCircle,
  X,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-green",
  COMPLETED: "badge-muted",
  CANCELLED: "badge-red",
};

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function DoctorAppointmentsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [patientMap, setPatientMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TODAY" | "UPCOMING" | "ALL">("TODAY");

  // Notes modal state
  const [notesAppt, setNotesAppt] = useState<Appointment | null>(null);
  const [notesText, setNotesText] = useState("");
  const [noteStatus, setNoteStatus] = useState("COMPLETED");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = (await appointmentsApi.getMy()) as Appointment[];
    setAppts(data);
    const ids = [...new Set(data.map((a) => a.patient_id))];
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profiles || []).forEach(
        (p: { id: string; full_name: string; phone_number: string | null }) => {
          map[p.id] = p as Profile;
        },
      );
      setPatientMap(map);
    }
    setLoading(false);
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!notesAppt) return;
    setSaving(true);
    setSaveError("");
    try {
      const token = await getAuthToken();
      const res = await fetch(
        `${API_URL}/appointments/${
          notesAppt.id
        }/notes?notes=${encodeURIComponent(notesText)}&status=${noteStatus}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save notes.");
      }
      setNotesAppt(null);
      setNotesText("");
      setNoteStatus("COMPLETED");
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function openNotesModal(a: Appointment) {
    setNotesAppt(a);
    setNotesText(a.doctor_notes || "");
    setNoteStatus(
      a.status === "CANCELLED"
        ? "COMPLETED"
        : a.status === "COMPLETED"
        ? "COMPLETED"
        : "COMPLETED",
    );
    setSaveError("");
  }

  const filtered = appts.filter((a) => {
    if (a.status === "CANCELLED") return filter === "ALL";
    const d = new Date(a.scheduled_at);
    if (filter === "TODAY") return isToday(d);
    if (filter === "UPCOMING") return !isPast(d);
    return true;
  });

  function dateLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, d MMM");
  }

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "860px" }}>
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
          <Calendar size={20} color="var(--accent-green)" />
          My Schedule
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.83rem",
            marginTop: "0.25rem",
          }}
        >
          Click the notes icon on any appointment to add post-consultation notes
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem" }}>
        {(["TODAY", "UPCOMING", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.35rem 1rem",
              borderRadius: "99px",
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid",
              background: filter === f ? "var(--accent-green)" : "transparent",
              color:
                filter === f ? "var(--text-inverse)" : "var(--text-secondary)",
              borderColor:
                filter === f ? "var(--accent-green)" : "var(--border-strong)",
            }}
          >
            {f === "TODAY" ? "Today" : f === "UPCOMING" ? "Upcoming" : "All"}
          </button>
        ))}
      </div>

      {/* Notes modal */}
      {notesAppt && (
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
              maxWidth: "500px",
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
              <div>
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Consultation Notes
                </h2>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "0.2rem",
                  }}
                >
                  {patientMap[notesAppt.patient_id]?.full_name || "Patient"} ·{" "}
                  {format(
                    new Date(notesAppt.scheduled_at),
                    "d MMM yyyy, h:mm a",
                  )}
                </p>
              </div>
              <button
                onClick={() => setNotesAppt(null)}
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
              onSubmit={handleSaveNotes}
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Chief complaint (read only reference) */}
              <div
                style={{
                  background: "var(--surface-input)",
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  fontSize: "0.83rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Chief Complaint
                </span>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    marginTop: "0.2rem",
                  }}
                >
                  {notesAppt.chief_complaint}
                </div>
              </div>

              <div>
                <label className="label">Post-Consultation Notes</label>
                <textarea
                  className="input"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Findings, recommendations, follow-up plan, medications prescribed…"
                  required
                  style={{ minHeight: "140px" }}
                />
              </div>

              <div>
                <label className="label">Update Status</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { value: "CONFIRMED", label: "Confirmed" },
                    { value: "COMPLETED", label: "Completed" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setNoteStatus(s.value)}
                      style={{
                        flex: 1,
                        padding: "0.6rem",
                        borderRadius: "8px",
                        border: "1px solid",
                        fontSize: "0.83rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        background:
                          noteStatus === s.value
                            ? "rgba(74,222,128,0.15)"
                            : "transparent",
                        color:
                          noteStatus === s.value
                            ? "var(--accent-green)"
                            : "var(--text-secondary)",
                        borderColor:
                          noteStatus === s.value
                            ? "var(--accent-green)"
                            : "var(--border-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      {noteStatus === s.value && <CheckCircle size={13} />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="alert-error" style={{ fontSize: "0.8rem" }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? "Saving…" : "Save Notes"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setNotesAppt(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments list */}
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "3rem" }}
        >
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Calendar
            size={32}
            color="var(--text-muted)"
            style={{ margin: "0 auto 0.75rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No appointments for this filter
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map((a) => {
            const patient = patientMap[a.patient_id];
            const canAddNote = a.status !== "CANCELLED";
            return (
              <div
                key={a.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                {/* Date block */}
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    background: "var(--surface-input)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--accent-green)",
                      lineHeight: 1,
                    }}
                  >
                    {format(new Date(a.scheduled_at), "d")}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {format(new Date(a.scheduled_at), "MMM")}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {patient?.full_name || "Patient"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {dateLabel(a.scheduled_at)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginTop: "0.15rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.chief_complaint}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Clock size={10} />
                      {format(new Date(a.scheduled_at), "h:mm a")} ·{" "}
                      {a.duration_mins}min
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <MapPin size={10} />
                      {a.location}
                    </span>
                  </div>

                  {/* Show existing notes if present */}
                  {a.doctor_notes && (
                    <div
                      style={{
                        marginTop: "0.6rem",
                        background: "var(--surface-input)",
                        borderRadius: "8px",
                        padding: "0.6rem 0.875rem",
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        borderLeft: "2px solid var(--accent-green)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Notes:{" "}
                      </span>
                      {a.doctor_notes}
                    </div>
                  )}
                </div>

                {/* Right side actions */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "0.5rem",
                    flexShrink: 0,
                  }}
                >
                  <span className={`badge ${STATUS_STYLES[a.status]}`}>
                    {a.status}
                  </span>
                  {canAddNote && (
                    <button
                      onClick={() => openNotesModal(a)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.72rem",
                        color: "var(--accent-green)",
                        background: "rgba(74,222,128,0.1)",
                        border: "1px solid rgba(74,222,128,0.25)",
                        borderRadius: "6px",
                        padding: "0.3rem 0.625rem",
                        cursor: "pointer",
                      }}
                    >
                      <FileEdit size={11} />
                      {a.doctor_notes ? "Edit notes" : "Add notes"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
