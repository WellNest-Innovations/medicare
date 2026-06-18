"use client";
import { useEffect, useState, useCallback } from "react";
import { vitalsApi } from "@/lib/api";
import { syncPendingVitals, getPendingVitals } from "@/lib/offline";
import { VitalLog } from "@/types";
import VitalsChart from "@/components/charts/VitalsChart";
import VitalLogForm from "@/components/forms/VitalLogForm";
import { Activity, RefreshCw, CloudUpload } from "lucide-react";

const VITAL_TABS: { value: VitalLog["vital_type"]; label: string; color: string }[] = [
  { value: "HEART_RATE",        label: "Heart Rate",     color: "#ef4444" },
  { value: "BLOOD_PRESSURE",    label: "Blood Pressure", color: "#3b82f6" },
  { value: "BLOOD_GLUCOSE",     label: "Blood Glucose",  color: "#8b5cf6" },
  { value: "OXYGEN_SATURATION", label: "SpO₂",           color: "#10b981" },
  { value: "BODY_TEMPERATURE",  label: "Temperature",    color: "#f97316" },
];

export default function PatientVitalsPage() {
  const [vitals, setVitals]         = useState<VitalLog[]>([]);
  const [activeTab, setActiveTab]   = useState<VitalLog["vital_type"]>("HEART_RATE");
  const [pendingCount, setPending]  = useState(0);
  const [syncing, setSyncing]       = useState(false);
  const [loading, setLoading]       = useState(true);

  const loadVitals = useCallback(async () => {
    try {
      const data = await vitalsApi.getMy() as VitalLog[];
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
    const count = await syncPendingVitals(async (v) => {
      await vitalsApi.submit({
        vital_type:      v.vital_type,
        value_primary:   v.value_primary,
        value_secondary: v.value_secondary,
        measured_at:     v.measured_at,
        is_offline_sync: true,
        notes:           v.notes,
      });
    });
    setSyncing(false);
    setPending(0);
    if (count > 0) loadVitals();
  }

  const activeColor = VITAL_TABS.find((t) => t.value === activeTab)?.color || "#3b82f6";

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-600" />
            My Vitals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your health readings over time</p>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing || !navigator.onLine}
            className="flex items-center gap-2 btn-secondary text-sm"
          >
            <CloudUpload className="w-4 h-4" />
            {syncing ? "Syncing…" : `Sync ${pendingCount} offline reading${pendingCount > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Vital type tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {VITAL_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart — takes 3/5 width */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-700">
              {VITAL_TABS.find((t) => t.value === activeTab)?.label} Trend
            </h2>
            <button onClick={loadVitals} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-300">Loading chart…</div>
          ) : (
            <VitalsChart vitals={vitals} vitalType={activeTab} color={activeColor} />
          )}
        </div>

        {/* Form — takes 2/5 width */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">Log New Reading</h2>
          <VitalLogForm onSubmitted={loadVitals} />
        </div>
      </div>

      {/* Recent readings table */}
      <div className="card mt-6">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Recent Readings</h2>
        {vitals.length === 0 ? (
          <p className="text-sm text-gray-400">No readings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Value</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {vitals.slice(0, 15).map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-700">{v.vital_type.replace("_", " ")}</td>
                    <td className="py-2 pr-4">
                      {v.value_primary}{v.value_secondary ? `/${v.value_secondary}` : ""} {v.unit}
                      {v.is_offline_sync && <span className="ml-1 badge bg-amber-50 text-amber-600">offline sync</span>}
                    </td>
                    <td className="py-2 pr-4 text-gray-400">
                      {new Date(v.measured_at).toLocaleString()}
                    </td>
                    <td className="py-2 text-gray-400">{v.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
