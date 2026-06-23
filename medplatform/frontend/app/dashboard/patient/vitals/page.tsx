"use client";
import { useEffect, useState, useCallback } from "react";
import { vitalsApi } from "@/lib/api";
import { syncPendingVitals, getPendingVitals } from "@/lib/offline";
import { VitalLog } from "@/types";
import VitalsChart from "@/components/charts/VitalsChart";
import VitalLogForm from "@/components/forms/VitalLogForm";
import { Activity, CloudUpload, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const TABS: { value: VitalLog["vital_type"]; label: string; color: string }[] =
  [
    { value: "HEART_RATE", label: "Heart Rate", color: "#F87171" },
    { value: "BLOOD_PRESSURE", label: "BP", color: "#60A5FA" },
    { value: "BLOOD_GLUCOSE", label: "Glucose", color: "#C084FC" },
    { value: "OXYGEN_SATURATION", label: "SpO₂", color: "#34D399" },
    { value: "BODY_TEMPERATURE", label: "Temp", color: "#FB923C" },
  ];

export default function PatientVitalsPage() {
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [activeTab, setActiveTab] =
    useState<VitalLog["vital_type"]>("HEART_RATE");
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVitals = useCallback(async () => {
    try {
      const data = (await vitalsApi.getMy()) as VitalLog[];
      setVitals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVitals();
    getPendingVitals().then((p) => setPending(p.length));
  }, [loadVitals]);

  async function handleSync() {
    setSyncing(true);
    await syncPendingVitals(async (v) => {
      await vitalsApi.submit({
        vital_type: v.vital_type,
        value_primary: v.value_primary,
        value_secondary: v.value_secondary,
        measured_at: v.measured_at,
        is_offline_sync: true,
        notes: v.notes,
      });
    });
    setSyncing(false);
    setPending(0);
    loadVitals();
  }

  const activeColor =
    TABS.find((t) => t.value === activeTab)?.color || "#4ADE80";
  const activeLabel = TABS.find((t) => t.value === activeTab)?.label || "";

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: "900px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        <div>
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
            <Activity size={20} color="var(--accent-green)" />
            My Vitals
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.83rem",
              marginTop: "0.2rem",
            }}
          >
            Track your health readings over time
          </p>
        </div>
        {pending > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary"
            style={{ fontSize: "0.8rem" }}
          >
            <CloudUpload size={14} />
            {syncing ? "Syncing…" : `Sync ${pending} offline`}
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "var(--surface-raised)",
          padding: "4px",
          borderRadius: "10px",
          marginBottom: "1.25rem",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              flex: 1,
              padding: "0.5rem 0.25rem",
              border: "none",
              borderRadius: "7px",
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              background:
                activeTab === tab.value ? "var(--surface-card)" : "transparent",
              color: activeTab === tab.value ? tab.color : "var(--text-muted)",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "1rem",
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
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {activeLabel} Trend
            </span>
            <button
              onClick={loadVitals}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
          {loading ? (
            <div
              style={{
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="spinner" />
            </div>
          ) : (
            <VitalsChart
              vitals={vitals}
              vitalType={activeTab}
              color={activeColor}
            />
          )}
        </div>
        <div className="card">
          <div
            style={{
              fontSize: "0.83rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "1rem",
            }}
          >
            LOG NEW READING
          </div>
          <VitalLogForm onSubmitted={loadVitals} />
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div
          style={{
            fontSize: "0.83rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: "1rem",
          }}
        >
          RECENT READINGS
        </div>
        {vitals.length === 0 ? (
          <p style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
            No readings yet
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Recorded</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {vitals.slice(0, 15).map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 500 }}>
                    {v.vital_type.replace(/_/g, " ")}
                  </td>
                  <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>
                    {v.value_primary}
                    {v.value_secondary ? `/${v.value_secondary}` : ""}{" "}
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 400 }}
                    >
                      {v.unit}
                    </span>
                    {v.is_offline_sync && (
                      <span
                        className="badge badge-amber"
                        style={{ marginLeft: "0.5rem" }}
                      >
                        offline
                      </span>
                    )}
                  </td>
                  <td
                    style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                  >
                    {format(new Date(v.measured_at), "d MMM, h:mm a")}
                  </td>
                  <td
                    style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                  >
                    {v.notes || "—"}
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
