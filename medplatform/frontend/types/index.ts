export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  date_of_birth?: string;
  phone_number?: string;
  blood_type?: string;
  known_allergies: string[];
  is_active: boolean;
  created_at: string;
}

export interface VitalLog {
  id: string;
  patient_id: string;
  vital_type: "HEART_RATE" | "BLOOD_PRESSURE" | "BLOOD_GLUCOSE" | "OXYGEN_SATURATION" | "BODY_TEMPERATURE";
  value_primary: number;
  value_secondary?: number;
  unit: string;
  measured_at: string;
  is_offline_sync: boolean;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  authored_by: string;
  category: "LAB_RESULT" | "CLINICAL_NOTE" | "DIAGNOSIS" | "PRESCRIPTION" | "ALLERGY";
  title: string;
  content: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduled_at: string;
  duration_mins: number;
  chief_complaint: string;
  location: string;
  meeting_url?: string;
  doctor_notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role?: string;
  action: string;
  target_table?: string;
  patient_context?: string;
  ip_address?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OfflineVital {
  id: string;
  vital_type: VitalLog["vital_type"];
  value_primary: number;
  value_secondary?: number;
  measured_at: string;
  notes?: string;
  synced: boolean;
}
