"use client";
import { useState } from "react";
import { vitalsApi } from "@/lib/api";
import { saveOfflineVital } from "@/lib/offline";
import { VitalLog } from "@/types";
import { CheckCircle, WifiOff, ChevronDown } from "lucide-react";

const OPTS: {
  value: VitalLog["vital_type"];
  label: string;
  unit: string;
  placeholder: string;
  min: number;
  max: number;
}[] = [
  {
    value: "HEART_RATE",
    label: "Heart Rate",
    unit: "bpm",
    placeholder: "e.g. 72",
    min: 20,
    max: 300,
  },
  {
    value: "BLOOD_GLUCOSE",
    label: "Blood Glucose",
    unit: "mmol/L",
    placeholder: "e.g. 5.4",
    min: 0.5,
    max: 55,
  },
  {
    value: "BLOOD_PRESSURE",
    label: "Blood Pressure",
    unit: "mmHg",
    placeholder: "Systolic",
    min: 50,
    max: 250,
  },
  {
    value: "OXYGEN_SATURATION",
    label: "Oxygen Saturation",
    unit: "%",
    placeholder: "e.g. 98",
    min: 50,
    max: 100,
  },
  {
    value: "BODY_TEMPERATURE",
    label: "Body Temperature",
    unit: "°C",
    placeholder: "e.g. 36.8",
    min: 25,
    max: 45,
  },
];

export default function VitalLogForm({
  onSubmitted,
}: {
  onSubmitted: () => void;
}) {
  const [vitalType, setVitalType] =
    useState<VitalLog["vital_type"]>("HEART_RATE");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");

  const isBP = vitalType === "BLOOD_PRESSURE";
  const sel = OPTS.find((v) => v.value === vitalType)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setOffline(false);
    const payload = {
      vital_type: vitalType,
      value_primary: parseFloat(primary),
      value_secondary: isBP ? parseFloat(secondary) : undefined,
      notes: notes || undefined,
      measured_at: new Date().toISOString(),
    };
    if (navigator.onLine) {
      try {
        await vitalsApi.submit(payload);
        setSuccess(true);
        setPrimary("");
        setSecondary("");
        setNotes("");
        onSubmitted();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    } else {
      await saveOfflineVital({
        vital_type: vitalType,
        value_primary: parseFloat(primary),
        value_secondary: isBP ? parseFloat(secondary) : undefined,
        measured_at: new Date().toISOString(),
        notes: notes || undefined,
      });
      setOffline(true);
      setPrimary("");
      setSecondary("");
      setNotes("");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div>
        <label className="label">Vital Type</label>
        <div style={{ position: "relative" }}>
          <select
            className="input"
            style={{ paddingRight: "2.5rem" }}
            value={vitalType}
            onChange={(e) =>
              setVitalType(e.target.value as VitalLog["vital_type"])
            }
          >
            {OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.unit})
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
        <label className="label">
          {isBP ? `Systolic (${sel.unit})` : `Value (${sel.unit})`}
        </label>
        <input
          className="input"
          type="number"
          step="0.01"
          min={sel.min}
          max={sel.max}
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder={sel.placeholder}
          required
        />
      </div>
      {isBP && (
        <div>
          <label className="label">Diastolic (mmHg)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="30"
            max="150"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder="e.g. 80"
            required
          />
        </div>
      )}
      <div>
        <label className="label">Notes (optional)</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context about this reading…"
          maxLength={400}
        />
      </div>
      {error && (
        <div className="alert-error" style={{ fontSize: "0.8rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert-success" style={{ fontSize: "0.8rem" }}>
          <CheckCircle size={14} />
          Vital logged successfully
        </div>
      )}
      {offline && (
        <div className="alert-warning" style={{ fontSize: "0.8rem" }}>
          <WifiOff size={14} />
          Saved offline — will sync when connected
        </div>
      )}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Log Vital"}
      </button>
    </form>
  );
}
