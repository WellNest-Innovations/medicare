"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { vitalsApi, recordsApi, appointmentsApi } from "@/lib/api";
import { VitalLog, MedicalRecord, Appointment } from "@/types";
import { Activity, FileText, Calendar, AlertCircle, Heart, Droplets, Wind } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PatientOverview() {
  const { profile } = useAuth();
  const [vitals, setVitals]         = useState<VitalLog[]>([]);
  const [records, setRecords]       = useState<MedicalRecord[]>([]);
  const [appointments, setAppts]    = useState<Appointment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [v, r, a] = await Promise.all([
          vitalsApi.getMy() as Promise<VitalLog[]>,
          recordsApi.getMy() as Promise<MedicalRecord[]>,
          appointmentsApi.getMy() as Promise<Appointment[]>,
        ]);
        setVitals(v); setRecords(r); setAppts(a);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latestVital = (type: VitalLog["vital_type"]) =>
    vitals.find((v) => v.vital_type === type);

  const upcomingAppts = appointments.filter(
    (a) => a.status !== "CANCELLED" && new Date(a.scheduled_at) > new Date()
  );

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Good morning, {profile?.full_name?.split(" ")[0]} 👋
      </h1>
      <p className="text-gray-500 mb-8">Here's your health overview</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Vitals summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <VitalCard
          icon={<Heart className="w-5 h-5 text-rose-500" />}
          label="Heart Rate"
          vital={latestVital("HEART_RATE")}
          color="rose"
        />
        <VitalCard
          icon={<Droplets className="w-5 h-5 text-blue-500" />}
          label="Blood Glucose"
          vital={latestVital("BLOOD_GLUCOSE")}
          color="blue"
        />
        <VitalCard
          icon={<Wind className="w-5 h-5 text-emerald-500" />}
          label="O₂ Saturation"
          vital={latestVital("OXYGEN_SATURATION")}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent records */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Recent Records
            </h2>
            <Link href="/dashboard/patient/records" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-gray-400">No records yet.</p>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.category} · {format(new Date(r.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700">{r.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Upcoming Appointments
            </h2>
            <Link href="/dashboard/patient/appointments" className="text-xs text-brand-600 hover:underline">Book new</Link>
          </div>
          {upcomingAppts.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppts.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-700">{format(new Date(a.scheduled_at), "d")}</span>
                    <span className="text-xs text-brand-500">{format(new Date(a.scheduled_at), "MMM")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.chief_complaint}</p>
                    <p className="text-xs text-gray-400">{format(new Date(a.scheduled_at), "h:mm a")} · {a.location}</p>
                  </div>
                  <span className={`badge ml-auto ${
                    a.status === "CONFIRMED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VitalCard({ icon, label, vital, color }: {
  icon: React.ReactNode;
  label: string;
  vital?: VitalLog;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {vital ? (
          <>
            <p className="text-xl font-bold text-gray-900">
              {vital.value_primary}
              {vital.value_secondary ? `/${vital.value_secondary}` : ""}
              <span className="text-sm font-normal text-gray-400 ml-1">{vital.unit}</span>
            </p>
            <p className="text-xs text-gray-400">{format(new Date(vital.measured_at), "MMM d")}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">No data</p>
        )}
      </div>
    </div>
  );
}
