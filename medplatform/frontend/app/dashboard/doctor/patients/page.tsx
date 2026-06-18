"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { Users, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DoctorPatientsPage() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("doctor_patient_assignments")
        .select("profiles!patient_id(id, full_name, date_of_birth, blood_type, known_allergies, phone_number, created_at)")
        .eq("doctor_id", profile?.id)
        .eq("is_active", true);
      const pts = (data || []).map((r: Record<string, unknown>) => r.profiles as Profile).filter(Boolean);
      setPatients(pts);
      setLoading(false);
    }
    if (profile?.id) load();
  }, [profile]);

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-brand-600" />
        My Patients
      </h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading patients…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No patients found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/doctor/patients/${p.id}`}
              className="card flex items-center gap-4 hover:border-brand-200 hover:shadow-md transition-all p-4"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg flex-shrink-0">
                {p.full_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.full_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.date_of_birth && (
                    <span className="text-xs text-gray-400">
                      DOB: {new Date(p.date_of_birth).toLocaleDateString()}
                    </span>
                  )}
                  {p.blood_type && (
                    <span className="badge bg-red-50 text-red-700">Blood: {p.blood_type}</span>
                  )}
                  {p.known_allergies?.length > 0 && (
                    <span className="badge bg-orange-50 text-orange-700">
                      {p.known_allergies.length} allerg{p.known_allergies.length > 1 ? "ies" : "y"}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
