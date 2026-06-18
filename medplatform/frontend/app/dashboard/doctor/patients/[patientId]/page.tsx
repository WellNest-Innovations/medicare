"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { recordsApi } from "@/lib/api";
import { MedicalRecord, Profile } from "@/types";
import { FileText, PlusCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient]   = useState<Profile | null>(null);
  const [records, setRecords]   = useState<MedicalRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "CLINICAL_NOTE", title: "", content: "" });

  async function load() {
    const [patRes, recData] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", patientId).single(),
      recordsApi.getPatient(patientId) as Promise<MedicalRecord[]>,
    ]);
    setPatient(patRes.data);
    setRecords(recData);
    setLoading(false);
  }

  useEffect(() => { load(); }, [patientId]);

  async function handleAppend(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordsApi.append({ ...form, patient_id: patientId });
      setForm({ category: "CLINICAL_NOTE", title: "", content: "" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  const CATEGORY_COLORS: Record<string, string> = {
    LAB_RESULT:    "bg-blue-50 text-blue-700",
    CLINICAL_NOTE: "bg-gray-50 text-gray-700",
    DIAGNOSIS:     "bg-red-50 text-red-700",
    PRESCRIPTION:  "bg-purple-50 text-purple-700",
    ALLERGY:       "bg-orange-50 text-orange-700",
  };

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!patient) return <div className="p-8 text-gray-400">Patient not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/doctor/patients" className="flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to patients
      </Link>

      {/* Patient header */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-2xl flex-shrink-0">
            {patient.full_name?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{patient.full_name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {patient.date_of_birth && <span className="text-sm text-gray-500">DOB: {format(new Date(patient.date_of_birth), "MMM d, yyyy")}</span>}
              {patient.blood_type && <span className="badge bg-red-50 text-red-700">Blood: {patient.blood_type}</span>}
              {patient.phone_number && <span className="text-sm text-gray-500">📞 {patient.phone_number}</span>}
            </div>
            {patient.known_allergies?.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-orange-700">⚠️ Allergies:</span>
                {patient.known_allergies.map((a) => (
                  <span key={a} className="badge bg-orange-50 text-orange-700">{a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Records section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Clinical Records ({records.length})
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" />
          Append Note
        </button>
      </div>

      {/* Append form */}
      {showForm && (
        <div className="card mb-4 border-brand-200">
          <h3 className="font-medium text-gray-900 mb-4">New Clinical Record</h3>
          <form onSubmit={handleAppend} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="CLINICAL_NOTE">Clinical Note</option>
                <option value="DIAGNOSIS">Diagnosis</option>
                <option value="LAB_RESULT">Lab Result</option>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="ALLERGY">Allergy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow-up consultation — 2024-06-10" required minLength={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Content</label>
              <textarea className="input resize-none" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Enter clinical notes, findings, or prescription details…" required minLength={10} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : "Save Record"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">No records yet for this patient.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="card p-0 overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`badge ${CATEGORY_COLORS[r.category]}`}>{r.category.replace("_", " ")}</span>
                  <span className="font-medium text-gray-900 text-sm">{r.title}</span>
                  <span className="text-xs text-gray-400">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                </div>
                {expanded === r.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded === r.id && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <pre className="mt-3 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 font-sans">{r.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
