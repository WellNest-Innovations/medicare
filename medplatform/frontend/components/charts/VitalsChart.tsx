"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { VitalLog } from "@/types";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface Props {
  vitals: VitalLog[];
  vitalType: VitalLog["vital_type"];
  color?: string;
}

const RANGES: Record<string, { min: number; max: number }> = {
  HEART_RATE: { min: 60, max: 100 },
  BLOOD_GLUCOSE: { min: 3.9, max: 7.8 },
  OXYGEN_SATURATION: { min: 95, max: 100 },
  BODY_TEMPERATURE: { min: 36.1, max: 37.2 },
  BLOOD_PRESSURE: { min: 90, max: 140 },
};

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !(payload as unknown[])?.length) return null;
  const data = payload as { value: number; name: string; color: string }[];
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "0.6rem 0.875rem",
        fontSize: "0.8rem",
      }}
    >
      <div style={{ color: "var(--text-muted)", marginBottom: "0.25rem" }}>
        {label as string}
      </div>
      {data.map((d, i) => (
        <div key={i} style={{ color: d.color, fontWeight: 600 }}>
          {d.name}: {d.value}
        </div>
      ))}
    </div>
  );
};

export default function VitalsChart({
  vitals,
  vitalType,
  color = "#4ADE80",
}: Props) {
  const filtered = vitals
    .filter((v) => v.vital_type === vitalType)
    .sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
    )
    .slice(-30)
    .map((v) => ({
      date: format(new Date(v.measured_at), "d MMM"),
      value: v.value_primary,
      diastolic: v.value_secondary,
    }));

  const isBP = vitalType === "BLOOD_PRESSURE";
  const range = RANGES[vitalType];

  if (filtered.length === 0)
    return (
      <div
        style={{
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.83rem",
        }}
      >
        No readings yet — log your first below
      </div>
    );

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={filtered}
          margin={{ top: 5, right: 8, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {range && (
            <ReferenceLine
              y={range.min}
              stroke="var(--accent-amber)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
          {range && (
            <ReferenceLine
              y={range.max}
              stroke="var(--accent-amber)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name={isBP ? "Systolic" : "Value"}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          {isBP && (
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic"
              stroke="var(--accent-amber)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--accent-amber)", strokeWidth: 0 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="disclaimer" style={{ marginTop: "0.75rem" }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
        <span>
          <strong>Medical disclaimer:</strong> These trends are for personal
          tracking only. Consult a qualified healthcare provider for clinical
          interpretation.
        </span>
      </div>
    </div>
  );
}
