"use client";
import { useState } from "react";
import { vitalsApi } from "@/lib/api";
import { saveOfflineVital } from "@/lib/offline";
import { VitalLog } from "@/types";
import { CheckCircle, WifiOff } from "lucide-react";

const VITAL_OPTIONS: { value: VitalLog["vital_type"]; label: string; unit: string; placeholder: string }[] = [
  { value: "HEART_RATE",        label: "Heart Rate",        unit: "bpm",    placeholder: "e.g. 72" },
  { value: "BLOOD_GLUCOSE",     label: "Blood Glucose",     unit: "mmol/L", placeholder: "e.g. 5.4" },
  { value: "BLOOD_PRESSURE",    label: "Blood Pressure",    unit: "mmHg",   placeholder: "Systolic e.g. 120" },
  { value: "OXYGEN_SATURATION", label: "Oxygen Saturation", unit: "%",      placeholder: "e.g. 98" },
  { value: "BODY_TEMPERATURE",  label: "Body Temperature",  unit: "°C",     placeholder: "e.g. 36.8" },
];

interface Props {
  onSubmitted: () => void;
}

export default function VitalLogForm({ onSubmitted }: Props) {
  const [vitalType, setVitalType]       = useState<VitalLog["vital_type"]>("HEART_RATE");
  const [primary, setPrimary]           = useState("");
  const [secondary, setSecondary]       = useState("");
  const [notes, setNotes]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError]               = useState("");

  const isBP = vitalType === "BLOOD_PRESSURE";
  const selected = VITAL_OPTIONS.find((v) => v.value === vitalType)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setSavedOffline(false);

    const payload = {
      vital_type:      vitalType,
      value_primary:   parseFloat(primary),
      value_secondary: isBP ? parseFloat(secondary) : undefined,
      notes:           notes || undefined,
      measured_at:     new Date().toISOString(),
    };

    if (navigator.onLine) {
      try {
        await vitalsApi.submit(payload);
        setSuccess(true);
        setPrimary(""); setSecondary(""); setNotes("");
        onSubmitted();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to submit.");
      }
    } else {
      // Offline: save to IndexedDB queue
      await saveOfflineVital({
        vital_type:    vitalType,
        value_primary: parseFloat(primary),
        value_secondary: isBP ? parseFloat(secondary) : undefined,
        measured_at:   new Date().toISOString(),
        notes:         notes || undefined,
      });
      setSavedOffline(true);
      setPrimary(""); setSecondary(""); setNotes("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vital Type</label>
        <select
          className="input"
          value={vitalType}
          onChange={(e) => setVitalType(e.target.value as VitalLog["vital_type"])}
        >
          {VITAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label} ({o.unit})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isBP ? "Systolic (mmHg)" : `Value (${selected.unit})`}
        </label>
        <input
          className="input"
          type="number"
          step="0.01"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder={selected.placeholder}
          required
        />
      </div>

      {isBP && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic (mmHg)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder="e.g. 80"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this reading..."
          maxLength={400}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          Vital logged successfully!
        </div>
      )}

      {savedOffline && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg text-sm">
          <WifiOff className="w-4 h-4" />
          Saved offline — will sync when connection is restored.
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Log Vital"}
      </button>
    </form>
  );
}
