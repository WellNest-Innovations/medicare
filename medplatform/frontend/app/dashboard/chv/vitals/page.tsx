"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { UserCheck, Activity, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CHVOverview() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("chv_patient_assignments")
        .select(
          "profiles!patient_id(id, full_name, blood_type, known_allergies, phone_number)",
        )
        .eq("chv_id", profile.id)
        .eq("is_active", true);
      const pts = (data || [])
        .map((r: Record<string, unknown>) => r.profiles as Profile)
        .filter(Boolean);
      setPatients(pts);
      setLoading(false);
    }
    load();
  }, [profile]);

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
    <div style={{ padding: "1.75rem 2rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.4rem",
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
            fontSize: "0.83rem",
            marginTop: "0.25rem",
          }}
        >
          Community Health Volunteer · Nyanza Region
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.875rem",
          marginBottom: "1.75rem",
        }}
      >
        <div className="stat-card">
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(74,222,128,0.15)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.5rem",
            }}
          >
            <UserCheck size={16} color="var(--accent-green)" />
          </div>
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Assigned Community Members</div>
        </div>
        <div className="stat-card">
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(252,211,77,0.15)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.5rem",
            }}
          >
            <AlertTriangle size={16} color="var(--accent-amber)" />
          </div>
          <div className="stat-value">
            {patients.filter((p) => p.known_allergies?.length > 0).length}
          </div>
          <div className="stat-label">Members with Known Allergies</div>
        </div>
      </div>

      {/* Quick action */}
      <Link
        href="/dashboard/chv/vitals"
        style={{
          textDecoration: "none",
          display: "block",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: "14px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "rgba(74,222,128,0.15)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Activity size={20} color="var(--accent-green)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              Log Vitals for Community Member
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginTop: "0.15rem",
              }}
            >
              Record health readings on behalf of a patient
            </div>
          </div>
          <ChevronRight size={18} color="var(--accent-green)" />
        </div>
      </Link>

      {/* Recent community members */}
      <div
        style={{
          fontSize: "0.83rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "0.75rem",
        }}
      >
        COMMUNITY MEMBERS
      </div>

      {patients.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "2.5rem" }}
        >
          <UserCheck
            size={32}
            color="var(--text-muted)"
            style={{ margin: "0 auto 0.75rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No community members assigned yet
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.78rem",
              marginTop: "0.4rem",
            }}
          >
            Contact your admin to get patients assigned to you
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {patients.slice(0, 8).map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(74,222,128,0.12)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
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
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {p.full_name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.2rem",
                  }}
                >
                  {p.blood_type && (
                    <span className="badge badge-red">{p.blood_type}</span>
                  )}
                  {p.known_allergies?.length > 0 && (
                    <span
                      className="badge badge-amber"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}
                    >
                      <AlertTriangle size={9} />
                      {p.known_allergies.length} allerg
                      {p.known_allergies.length > 1 ? "ies" : "y"}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard/chv/vitals"
                style={{ textDecoration: "none" }}
              >
                <button
                  className="btn-secondary"
                  style={{
                    padding: "0.4rem 0.875rem",
                    fontSize: "0.75rem",
                    minHeight: "unset",
                  }}
                >
                  Log vitals
                </button>
              </Link>
            </div>
          ))}
          {patients.length > 8 && (
            <Link
              href="/dashboard/chv/patients"
              style={{
                textAlign: "center",
                fontSize: "0.8rem",
                color: "var(--accent-green)",
                textDecoration: "none",
                padding: "0.75rem",
              }}
            >
              View all {patients.length} members →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
