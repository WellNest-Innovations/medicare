"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { VitalLog } from "@/types";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface Props {
  vitals: VitalLog[];
  vitalType: VitalLog["vital_type"];
  color?: string;
}

export default function VitalsChart({ vitals, vitalType, color = "#3b82f6" }: Props) {
  const filtered = vitals
    .filter((v) => v.vital_type === vitalType)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .slice(-30)
    .map((v) => ({
      date:      format(new Date(v.measured_at), "MMM d"),
      value:     v.value_primary,
      diastolic: v.value_secondary,
    }));

  if (filtered.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No data yet. Log your first reading below.
      </div>
    );
  }

  const isBP = vitalType === "BLOOD_PRESSURE";

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {isBP && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            name={isBP ? "Systolic" : "Value"}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          {isBP && (
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* ⚠️ Medical disclaimer — required per spec */}
      <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Medical Disclaimer:</strong> These trend visualizations are for personal tracking
          only and do not constitute medical advice. Always consult a qualified healthcare provider
          for clinical interpretation of your health data.
        </p>
      </div>
    </div>
  );
}
