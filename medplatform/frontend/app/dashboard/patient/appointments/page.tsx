"use client";
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/types";
import { Calendar, Plus, X, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function PatientAppointmentsPage() {
  const [appointments, setAppts]     = useState<Appointment[]>([]);
  const [doctors, setDoctors]        = useState<{ id: string; full_name: string }[]>([]);
  const [showForm, setShowForm]      = useState(false);
  const [loading, setLoading]        = useState(true);
  const [submitting, setSubmitting]  = useState(false);
  const [form, setForm]              = useState({
    doctor_id: "", scheduled_at: "", duration_mins: 30,
    chief_complaint: "", location: "TELEHEALTH",
  });

  async function load() {
    const [appts, docs] = await Promise.all([
      appointmentsApi.getMy() as Promise<Appointment[]>,
      appointmentsApi.getDoctors() as Promise<{ id: string; full_name: string }[]>,
    ]);
    setAppts(appts); setDoctors(docs); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      setShowForm(false);
      setForm({ doctor_id: "", scheduled_at: "", duration_mins: 30, chief_complaint: "", location: "TELEHEALTH" });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to book.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    await appointmentsApi.cancel(id);
    load();
  }

  const STATUS_COLORS: Record<string, string> = {
    PENDING:   "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-green-50 text-green-700",
    COMPLETED: "bg-gray-50 text-gray-600",
    CANCELLED: "bg-red-50 text-red-600",
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-600" />
          Appointments
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Booking form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold">Book Appointment</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select className="input" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} required>
                  <option value="">Select a doctor…</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input className="input" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select className="input" value={form.duration_mins} onChange={(e) => setForm({ ...form, duration_mins: parseInt(e.target.value) })}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  <option value="TELEHEALTH">Telehealth (Video Call)</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <textarea className="input resize-none" rows={3} value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} placeholder="Briefly describe your symptoms or reason for visit…" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? "Booking…" : "Confirm Booking"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments list */}
      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No appointments yet. Book your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="card flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-brand-700 leading-none">
                    {format(new Date(a.scheduled_at), "d")}
                  </span>
                  <span className="text-xs text-brand-500">{format(new Date(a.scheduled_at), "MMM")}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{a.chief_complaint}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(a.scheduled_at), "h:mm a")} · {a.duration_mins}min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {a.location}
                    </span>
                  </div>
                  {a.doctor_notes && (
                    <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1">
                      Doctor note: {a.doctor_notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                {a.status === "PENDING" && (
                  <button onClick={() => handleCancel(a.id)} className="text-xs text-red-500 hover:text-red-700">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
