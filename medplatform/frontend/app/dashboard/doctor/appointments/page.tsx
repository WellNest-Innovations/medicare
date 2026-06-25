"use client";
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Appointment, Profile } from "@/types";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-green",
  COMPLETED: "badge-muted",
  CANCELLED: "badge-red",
};

export default function DoctorAppointmentsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [patientMap, setPatientMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TODAY" | "UPCOMING" | "ALL">("TODAY");

  useEffect(() => {
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
          (p: {
            id: string;
            full_name: string;
            phone_number: string | null;
          }) => {
            map[p.id] = p as Profile;
          },
        );
        setPatientMap(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = appts.filter((a) => {
    if (a.status === "CANCELLED") return false;
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
    <div style={{ padding: "1.75rem 2rem", maxWidth: "800px" }}>
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
      </div>

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
            return (
              <div
                key={a.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
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
                      marginTop: "0.25rem",
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
                </div>
                <span className={`badge ${STATUS_STYLES[a.status]}`}>
                  {a.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
