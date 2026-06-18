import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Vitals ──────────────────────────────────────────────────
export const vitalsApi = {
  submit: (body: object) =>
    apiFetch("/vitals/submit", { method: "POST", body: JSON.stringify(body) }),

  getMy: (vital_type?: string) =>
    apiFetch(`/vitals/my${vital_type ? `?vital_type=${vital_type}` : ""}`),
};

// ── Records ─────────────────────────────────────────────────
export const recordsApi = {
  getMy: () => apiFetch("/records/my"),
  getPatient: (patientId: string) => apiFetch(`/records/patient/${patientId}`),
  append: (body: object) =>
    apiFetch("/records/append", { method: "POST", body: JSON.stringify(body) }),
};

// ── Appointments ─────────────────────────────────────────────
export const appointmentsApi = {
  getMy: () => apiFetch("/appointments/my"),
  create: (body: object) =>
    apiFetch("/appointments/", { method: "POST", body: JSON.stringify(body) }),
  cancel: (id: string) =>
    apiFetch(`/appointments/${id}/cancel`, { method: "PATCH" }),
  getDoctors: () => apiFetch("/appointments/doctors"),
};

// ── Admin ────────────────────────────────────────────────────
export const adminApi = {
  getAuditLogs: (page = 1, action?: string) =>
    apiFetch(`/admin/audit-logs?page=${page}${action ? `&action=${action}` : ""}`),
  getUsers: (role?: string) =>
    apiFetch(`/admin/users${role ? `?role=${role}` : ""}`),
  assignRole: (userId: string, role: string) =>
    apiFetch(`/admin/users/${userId}/role?new_role=${role}`, { method: "PATCH" }),
  assignDoctor: (doctorId: string, patientId: string) =>
    apiFetch(`/admin/assignments?doctor_id=${doctorId}&patient_id=${patientId}`, { method: "POST" }),
};
