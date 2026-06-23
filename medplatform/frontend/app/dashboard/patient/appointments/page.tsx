"use client";
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/types";
import { Calendar, Plus, X, Clock, MapPin, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-green",
  COMPLETED: "badge-muted",
  CANCELLED: "badge-red",
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; full_name: string }[]>(
    [],
  );
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    doctor_id: "",
    scheduled_at: "",
    duration_mins: 30,
    chief_complaint: "",
    location: "TELEHEALTH",
  });

  async function load() {
    const [appts, docs] = await Promise.all([
      appointmentsApi.getMy() as Promise<Appointment[]>,
      appointmentsApi.getDoctors() as Promise<
        { id: string; full_name: string }[]
      >,
    ]);
    setAppts(appts);
    setDoctors(docs);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      setShowForm(false);
      setForm({
        doctor_id: "",
        scheduled_at: "",
        duration_mins: 30,
        chief_complaint: "",
        location: "TELEHEALTH",
      });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to book.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    await appointmentsApi.cancel(id);
    load();
  }

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "800px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
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
          Appointments
        </h1>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "0.6rem 1.25rem" }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} />
          Book
        </button>
      </div>

      {/* Booking modal */}
      {showForm && (
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
              borderRadius: "var(--radius-xl)",
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
                Book Appointment
              </h2>
              <button
                onClick={() => setShowForm(false)}
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
              onSubmit={handleBook}
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label className="label">Provider</label>
                <div style={{ position: "relative" }}>
                  <select
                    className="input"
                    style={{ paddingRight: "2.5rem" }}
                    value={form.doctor_id}
                    onChange={(e) =>
                      setForm({ ...form, doctor_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a provider…</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Duration</label>
                <div style={{ position: "relative" }}>
                  <select
                    className="input"
                    style={{ paddingRight: "2.5rem" }}
                    value={form.duration_mins}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_mins: parseInt(e.target.value),
                      })
                    }
                  >
                    {[15, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <div style={{ position: "relative" }}>
                  <select
                    className="input"
                    style={{ paddingRight: "2.5rem" }}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  >
                    <option value="TELEHEALTH">Telehealth (Video Call)</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Reason for visit</label>
                <textarea
                  className="input"
                  value={form.chief_complaint}
                  onChange={(e) =>
                    setForm({ ...form, chief_complaint: e.target.value })
                  }
                  placeholder="Describe your symptoms or reason for visit…"
                  required
                  style={{ minHeight: "80px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? "Booking…" : "Confirm Booking"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "3rem" }}
        >
          <div className="spinner" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Calendar
            size={32}
            color="var(--text-muted)"
            style={{ margin: "0 auto 0.75rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No appointments yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {appointments.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {a.chief_complaint}
                </div>
                <div
                  style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Clock size={11} />
                    {format(new Date(a.scheduled_at), "h:mm a")} ·{" "}
                    {a.duration_mins}min
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <MapPin size={11} />
                    {a.location}
                  </span>
                </div>
                {a.doctor_notes && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      background: "var(--surface-input)",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                    }}
                  >
                    Provider note: {a.doctor_notes}
                  </div>
                )}
              </div>
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
                {a.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(a.id)}
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--accent-red)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
