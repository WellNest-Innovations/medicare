"use client";
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Appointment, Profile } from "@/types";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppts] = useState<Appointment[]>([]);
  const [patientMap, setPatientMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"UPCOMING" | "TODAY" | "ALL">("TODAY");

  useEffect(() => {
    async function load() {
      const appts = await appointmentsApi.getMy() as Appointment[];
      setAppts(appts);
      const ids = [...new Set(appts.map((a) => a.patient_id))];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id, full_name, phone_number").in("id", ids);
        const map: Record<string, Profile> = {};
        (data || []).forEach((p: Profile) => { map[p.id] = p; });
        setPatientMap(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = appointments.filter((a) => {
    if (a.status === "CANCELLED") return false;
    const d = new Date(a.scheduled_at);
    if (filter === "TODAY") return isToday(d);
    if (filter === "UPCOMING") return !isPast(d);
    return true;
  });

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-green-50 text-green-700",
    COMPLETED: "bg-gray-50 text-gray-600",
    CANCELLED: "bg-red-50 text-red-600",
  };

  function dateLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d))    return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-brand-600" />
        My Schedule
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["TODAY", "UPCOMING", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "TODAY" ? "Today" : f === "UPCOMING" ? "Upcoming" : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No appointments for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const patient = patientMap[a.patient_id];
            return (
              <div key={a.id} className="card flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center">
                  <span className="text-lg font-bold text-brand-700 leading-none">{format(new Date(a.scheduled_at), "d")}</span>
                  <span className="text-xs text-brand-400">{format(new Date(a.scheduled_at), "MMM")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{patient?.full_name || "Patient"}</p>
                    <span className="text-xs text-gray-400">{dateLabel(a.scheduled_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">{a.chief_complaint}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />{format(new Date(a.scheduled_at), "h:mm a")} · {a.duration_mins}min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />{a.location}
                    </span>
                  </div>
                </div>
                <span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
