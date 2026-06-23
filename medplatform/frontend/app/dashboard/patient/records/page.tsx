"use client";
import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { MedicalRecord } from "@/types";
import { FileText, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  LAB_RESULT: "badge-blue",
  CLINICAL_NOTE: "badge-muted",
  DIAGNOSIS: "badge-red",
  PRESCRIPTION: "badge-green",
  ALLERGY: "badge-amber",
};

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi.getMy().then((data) => {
      setRecords(data as MedicalRecord[]);
      setLoading(false);
    });
  }, []);

  const categories = [
    "ALL",
    "LAB_RESULT",
    "CLINICAL_NOTE",
    "DIAGNOSIS",
    "PRESCRIPTION",
    "ALLERGY",
  ];
  const filtered =
    filter === "ALL" ? records : records.filter((r) => r.category === filter);

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
          <FileText size={20} color="var(--accent-green)" />
          My Medical Records
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: "0.3rem",
          }}
        >
          <Lock size={11} color="var(--text-muted)" />
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.78rem",
              margin: 0,
            }}
          >
            Read-only — records are managed by your healthcare provider
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: "0.35rem 0.875rem",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid",
              transition: "all 0.15s",
              background: filter === c ? "var(--accent-green)" : "transparent",
              color:
                filter === c ? "var(--text-inverse)" : "var(--text-secondary)",
              borderColor:
                filter === c ? "var(--accent-green)" : "var(--border-strong)",
            }}
          >
            {c.replace(/_/g, " ")}
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
          <FileText
            size={32}
            color="var(--text-muted)"
            style={{ margin: "0 auto 0.75rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No records found
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    className={`badge ${
                      CATEGORY_COLORS[r.category] || "badge-muted"
                    }`}
                  >
                    {r.category.replace(/_/g, " ")}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
                      {format(
                        new Date(r.created_at),
                        "d MMMM yyyy 'at' h:mm a",
                      )}
                    </div>
                  </div>
                </div>
                {expanded === r.id ? (
                  <ChevronUp
                    size={15}
                    color="var(--text-muted)"
                    style={{ flexShrink: 0 }}
                  />
                ) : (
                  <ChevronDown
                    size={15}
                    color="var(--text-muted)"
                    style={{ flexShrink: 0 }}
                  />
                )}
              </button>
              {expanded === r.id && (
                <div
                  style={{
                    padding: "0 1.25rem 1.25rem",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <pre
                    style={{
                      marginTop: "1rem",
                      fontFamily: "inherit",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      background: "var(--surface-input)",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                      margin: 0,
                    }}
                  >
                    {r.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
