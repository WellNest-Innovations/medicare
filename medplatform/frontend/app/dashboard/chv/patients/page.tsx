"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { UserCheck, Search, AlertTriangle, Phone } from "lucide-react";
import Link from "next/link";

export default function CHVPatientsPage() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("chv_patient_assignments")
        .select(
          "profiles!patient_id(id, full_name, date_of_birth, blood_type, known_allergies, phone_number)",
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

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

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
          <UserCheck size={20} color="var(--accent-green)" />
          Community Members
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.83rem",
            marginTop: "0.25rem",
          }}
        >
          {patients.length} member{patients.length !== 1 ? "s" : ""} in your
          care area
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          className="input"
          style={{ paddingLeft: "2.75rem" }}
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "3rem" }}
        >
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <UserCheck
            size={32}
            color="var(--text-muted)"
            style={{ margin: "0 auto 0.75rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No members found
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(74,222,128,0.12)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
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
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {p.full_name}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.4rem",
                    marginTop: "0.3rem",
                  }}
                >
                  {p.date_of_birth && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      DOB: {new Date(p.date_of_birth).toLocaleDateString()}
                    </span>
                  )}
                  {p.blood_type && (
                    <span className="badge badge-red">{p.blood_type}</span>
                  )}
                  {p.phone_number && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Phone size={10} />
                      {p.phone_number}
                    </span>
                  )}
                </div>
                {p.known_allergies?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      marginTop: "0.4rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--accent-amber)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}
                    >
                      <AlertTriangle size={10} />
                    </span>
                    {p.known_allergies.map((a) => (
                      <span key={a} className="badge badge-amber">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/dashboard/chv/vitals"
                style={{ textDecoration: "none" }}
              >
                <button
                  className="btn-secondary"
                  style={{
                    padding: "0.45rem 0.875rem",
                    fontSize: "0.75rem",
                    minHeight: "unset",
                    flexShrink: 0,
                  }}
                >
                  Log vitals
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
