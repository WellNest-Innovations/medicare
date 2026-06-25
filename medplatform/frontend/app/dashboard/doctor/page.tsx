"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { appointmentsApi } from "@/lib/api";
import { Appointment, Profile } from "@/types";
import {
  Users,
  Calendar,
  Clock,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { format, isToday } from "date-fns";
import Link from "next/link";

export default function DoctorOverview() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const [apptData, assignRes] = await Promise.all([
        appointmentsApi.getMy() as Promise<Appointment[]>,
        supabase
          .from("doctor_patient_assignments")
          .select(
            "profiles!patient_id(id, full_name, blood_type, known_allergies, phone_number)",
          )
          .eq("doctor_id", profile.id)
          .eq("is_active", true),
      ]);
      setAppts(apptData);
      const pts = (assignRes.data || [])
        .map((r: Record<string, unknown>) => r.profiles as Profile)
        .filter(Boolean);
      setPatients(pts);
      setLoading(false);
    }
    load();
  }, [profile]);

  const todayAppts = appts.filter((a) => {
    return isToday(new Date(a.scheduled_at)) && a.status !== "CANCELLED";
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div className="spinner" />
      </div>
    );

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
          {greeting}, Dr. {profile?.full_name?.split(" ").slice(-1)[0]} 👨‍⚕️
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.83rem",
            marginTop: "0.25rem",
          }}
        >
          Clinical overview for today
        </p>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "0.875rem",
          marginBottom: "1.75rem",
        }}
      >
        {[
          {
            icon: <Users size={16} color="var(--accent-blue)" />,
            label: "Assigned Patients",
            value: patients.length,
            color: "var(--accent-blue)",
          },
          {
            icon: <Calendar size={16} color="var(--accent-green)" />,
            label: "Today's Appointments",
            value: todayAppts.length,
            color: "var(--accent-green)",
          },
          {
            icon: <Clock size={16} color="var(--accent-amber)" />,
            label: "Total Appointments",
            value: appts.length,
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

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        {/* Today's schedule */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              TODAY'S SCHEDULE
            </span>
            <Link
              href="/dashboard/doctor/appointments"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-green)",
                textDecoration: "none",
              }}
            >
              View all
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
              No appointments today
            </p>
          ) : (
            todayAppts.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(74,222,128,0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={14} color="var(--accent-green)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.chief_complaint}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: "0.1rem",
                    }}
                  >
                    {format(new Date(a.scheduled_at), "h:mm a")} · {a.location}
                  </div>
                </div>
                <span
                  className={`badge ${
                    a.status === "CONFIRMED" ? "badge-green" : "badge-amber"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Patient list */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              MY PATIENTS
            </span>
            <Link
              href="/dashboard/doctor/patients"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-green)",
                textDecoration: "none",
              }}
            >
              View all
            </Link>
          </div>
          {patients.length === 0 ? (
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
              No patients assigned yet
            </p>
          ) : (
            patients.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/doctor/patients/${p.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.625rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                  marginBottom: "2px",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "transparent")
                }
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.83rem",
                    fontWeight: 700,
                    color: "var(--accent-green)",
                    flexShrink: 0,
                  }}
                >
                  {p.full_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.full_name}
                  </div>
                  <div
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    Blood: {p.blood_type || "Unknown"}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
