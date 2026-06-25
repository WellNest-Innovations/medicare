"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { vitalsApi, recordsApi, appointmentsApi } from "@/lib/api";
import { VitalLog, MedicalRecord, Appointment } from "@/types";
import {
  Activity,
  FileText,
  Calendar,
  Heart,
  Droplets,
  Wind,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PatientOverview() {
  const { profile } = useAuth();
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [v, r, a] = await Promise.all([
          vitalsApi.getMy() as Promise<VitalLog[]>,
          recordsApi.getMy() as Promise<MedicalRecord[]>,
          appointmentsApi.getMy() as Promise<Appointment[]>,
        ]);
        setVitals(v);
        setRecords(r);
        setAppts(a);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latestVital = (type: VitalLog["vital_type"]) =>
    vitals.find((v) => v.vital_type === type);
  const upcoming = appts.filter(
    (a) => a.status !== "CANCELLED" && new Date(a.scheduled_at) > new Date(),
  );

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
    <div style={{ padding: "1.75rem 2rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {greeting}, {profile?.full_name?.split(" ")[0]} 👋
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: "0.25rem",
          }}
        >
          Here is your health overview
        </p>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Vitals strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "0.875rem",
          marginBottom: "1.5rem",
        }}
      >
        <VitalCard
          icon={<Heart size={17} color="var(--accent-red)" />}
          label="Heart Rate"
          vital={latestVital("HEART_RATE")}
          accentColor="var(--accent-red)"
        />
        <VitalCard
          icon={<Droplets size={17} color="var(--accent-blue)" />}
          label="Blood Glucose"
          vital={latestVital("BLOOD_GLUCOSE")}
          accentColor="var(--accent-blue)"
        />
        <VitalCard
          icon={<Wind size={17} color="var(--accent-teal)" />}
          label="SpO₂"
          vital={latestVital("OXYGEN_SATURATION")}
          accentColor="var(--accent-teal)"
        />
      </div>

      {/* Quick actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.875rem",
          marginBottom: "1.5rem",
        }}
      >
        <Link
          href="/dashboard/patient/vitals"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(74,222,128,0.15)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={18} color="var(--accent-green)" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Log Vitals
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Record a reading
              </div>
            </div>
          </div>
        </Link>
        <Link
          href="/dashboard/patient/appointments"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(96,165,250,0.15)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Calendar size={18} color="var(--accent-blue)" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Book Appointment
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                See a provider
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.875rem",
        }}
      >
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
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <FileText size={12} />
              RECENT RECORDS
            </span>
            <Link
              href="/dashboard/patient/records"
              style={{
                fontSize: "0.72rem",
                color: "var(--accent-green)",
                textDecoration: "none",
              }}
            >
              View all
            </Link>
          </div>
          {records.length === 0 ? (
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
              No records yet
            </p>
          ) : (
            records.slice(0, 4).map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: "0.625rem",
                  marginBottom: "0.625rem",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: "0.15rem",
                    }}
                  >
                    {format(new Date(r.created_at), "d MMM yyyy")}
                  </div>
                </div>
                <span
                  className="badge badge-blue"
                  style={{ flexShrink: 0, marginLeft: "0.5rem" }}
                >
                  {r.category.replace(/_/g, " ")}
                </span>
              </div>
            ))
          )}
        </div>

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
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Calendar size={12} />
              UPCOMING
            </span>
            <Link
              href="/dashboard/patient/appointments"
              style={{
                fontSize: "0.72rem",
                color: "var(--accent-green)",
                textDecoration: "none",
              }}
            >
              Book new
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
              No upcoming appointments
            </p>
          ) : (
            upcoming.slice(0, 3).map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  paddingBottom: "0.75rem",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    background: "var(--surface-input)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.95rem",
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
                <div>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {a.chief_complaint}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      marginTop: "0.2rem",
                    }}
                  >
                    <Clock size={10} />
                    {format(new Date(a.scheduled_at), "h:mm a")} · {a.location}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function VitalCard({
  icon,
  label,
  vital,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  vital?: VitalLog;
  accentColor: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "14px",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.6rem",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            background: `${accentColor}18`,
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      {vital ? (
        <>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {vital.value_primary}
            {vital.value_secondary ? `/${vital.value_secondary}` : ""}
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 400,
                color: "var(--text-muted)",
                marginLeft: "0.25rem",
              }}
            >
              {vital.unit}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            {format(new Date(vital.measured_at), "d MMM, h:mm a")}
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          No data yet
        </div>
      )}
    </div>
  );
}
