from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal
from datetime import datetime
from uuid import UUID

VITAL_UNITS = {
    "HEART_RATE": "bpm",
    "BLOOD_GLUCOSE": "mmol/L",
    "BLOOD_PRESSURE": "mmHg",
    "OXYGEN_SATURATION": "%",
    "BODY_TEMPERATURE": "°C",
}

VITAL_RANGES = {
    "HEART_RATE":        (20,  300),
    "BLOOD_GLUCOSE":     (0.5, 55),
    "BLOOD_PRESSURE":    (50,  250),
    "OXYGEN_SATURATION": (50,  100),
    "BODY_TEMPERATURE":  (25,  45),
}


# ── Vitals ─────────────────────────────────────────────────────
class VitalSubmitRequest(BaseModel):
    vital_type: Literal["HEART_RATE","BLOOD_PRESSURE","BLOOD_GLUCOSE","OXYGEN_SATURATION","BODY_TEMPERATURE"]
    value_primary: float
    value_secondary: float | None = None
    measured_at: datetime | None = None
    is_offline_sync: bool = False
    notes: str | None = Field(None, max_length=400)

    @model_validator(mode="after")
    def validate_ranges_and_bp(self) -> "VitalSubmitRequest":
        lo, hi = VITAL_RANGES[self.vital_type]
        if not (lo <= self.value_primary <= hi):
            raise ValueError(f"{self.vital_type} value {self.value_primary} out of range ({lo}–{hi})")
        if self.vital_type == "BLOOD_PRESSURE" and self.value_secondary is None:
            raise ValueError("Blood pressure requires value_secondary (diastolic)")
        return self


class VitalResponse(BaseModel):
    id: UUID
    patient_id: UUID
    vital_type: str
    value_primary: float
    value_secondary: float | None
    unit: str
    measured_at: datetime
    is_offline_sync: bool
    notes: str | None


# ── Medical Records ────────────────────────────────────────────
class RecordAppendRequest(BaseModel):
    patient_id: UUID
    category: Literal["LAB_RESULT","CLINICAL_NOTE","DIAGNOSIS","PRESCRIPTION","ALLERGY"]
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)


class RecordResponse(BaseModel):
    id: UUID
    patient_id: UUID
    authored_by: UUID
    category: str
    title: str
    content: str
    created_at: datetime


# ── Appointments ───────────────────────────────────────────────
class AppointmentCreateRequest(BaseModel):
    doctor_id: UUID
    scheduled_at: datetime
    duration_mins: int = Field(30, ge=10, le=120)
    chief_complaint: str = Field(..., min_length=5, max_length=500)
    location: str = "TELEHEALTH"


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    status: str
    scheduled_at: datetime
    duration_mins: int
    chief_complaint: str
    location: str
    meeting_url: str | None
    doctor_notes: str | None
    created_at: datetime


# ── Profiles ───────────────────────────────────────────────────
class ProfileResponse(BaseModel):
    id: UUID
    role: str
    full_name: str
    date_of_birth: str | None
    phone_number: str | None
    blood_type: str | None
    known_allergies: list[str]
    is_active: bool
    created_at: datetime


# ── Audit Logs ─────────────────────────────────────────────────
class AuditLogEntry(BaseModel):
    id: UUID
    actor_id: UUID | None
    actor_role: str | None
    action: str
    target_table: str | None
    patient_context: UUID | None
    ip_address: str | None
    metadata: dict
    created_at: datetime


class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[AuditLogEntry]
