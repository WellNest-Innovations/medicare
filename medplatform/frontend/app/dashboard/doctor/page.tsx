"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { appointmentsApi } from "@/lib/api";
import { Appointment, Profile } from "@/types";
import { Users, Calendar, ClipboardList, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function DoctorOverview() {
  const { profile } = useAuth();
  const [patients, setPatients]   = useState<Profile[]>([]);
  const [appointments, setAppts]  = useState<Appointment[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const [appts, assignRes] = await Promise.all([
        appointmentsApi.getMy() as Promise<Appointment[]>,
        supabase
          .from("doctor_patient_assignments")
          .select("patient_id, profiles!patient_id(id, full_name, blood_type, known_allergies)")
          .eq("doctor_id", profile?.id)
          .eq("is_active", true),
      ]);
      setAppts(appts);
      const pts = (assignRes.data || []).map((r: Record<string, unknown>) => r.profiles as Profile);
      setPatients(pts.filter(Boolean));
      setLoading(false);
    }
    if (profile?.id) load();
  }, [profile]);

  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() && a.status !== "CANCELLED";
  });

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome, {profile?.full_name} 👨‍⚕️
      </h1>
      <p className="text-gray-500 mb-8">Your clinical overview for today</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5 text-brand-600" />} label="Assigned Patients" value={patients.length} />
        <StatCard icon={<Calendar className="w-5 h-5 text-green-600" />} label="Today's Appointments" value={todayAppts.length} />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-purple-600" />} label="Total Appointments" value={appointments.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Today&apos;s Schedule
            </h2>
            <Link href="/dashboard/doctor/appointments" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-gray-400">No appointments today.</p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.chief_complaint}</p>
                    <p className="text-xs text-gray-400">{format(new Date(a.scheduled_at), "h:mm a")} · {a.location}</p>
                  </div>
                  <span className={`badge text-xs ${a.status === "CONFIRMED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              My Patients
            </h2>
            <Link href="/dashboard/doctor/patients" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-400">No patients assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {patients.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/dashboard/doctor/patients/${p.id}`}
                  className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {p.full_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.full_name}</p>
                    <p className="text-xs text-gray-400">Blood type: {p.blood_type || "Unknown"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}
