from fastapi import APIRouter, Depends, Request, HTTPException
from app.middleware.auth import require_patient, require_doctor, require_admin, decode_token, TokenPayload
from app.models.schemas import AppointmentCreateRequest, AppointmentResponse
from app.core.supabase_client import supabase
from app.core.audit import write_audit_log

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    body: AppointmentCreateRequest,
    request: Request,
    token: TokenPayload = Depends(require_patient),
):
    row = {
        "patient_id":      token.sub,
        "doctor_id":       str(body.doctor_id),
        "scheduled_at":    body.scheduled_at.isoformat(),
        "duration_mins":   body.duration_mins,
        "chief_complaint": body.chief_complaint,
        "location":        body.location,
    }
    result = supabase.table("appointments").insert(row).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create appointment.")
    saved = result.data[0]
    write_audit_log(
        actor_id=token.sub, actor_role=token.app_role, action="APPOINTMENT_CREATE",
        target_table="appointments", target_id=saved["id"],
        patient_context=token.sub,
        ip_address=request.client.host if request.client else None,
    )
    return AppointmentResponse(**saved)


@router.get("/my", response_model=list[AppointmentResponse])
async def get_my_appointments(token: TokenPayload = Depends(decode_token)):
    if token.app_role == "PATIENT":
        result = supabase.table("appointments").select("*").eq("patient_id", token.sub).order("scheduled_at", desc=True).execute()
    elif token.app_role == "DOCTOR":
        result = supabase.table("appointments").select("*").eq("doctor_id", token.sub).order("scheduled_at", desc=True).execute()
    else:
        result = supabase.table("appointments").select("*").order("scheduled_at", desc=True).limit(100).execute()
    return [AppointmentResponse(**r) for r in result.data]


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: str,
    token: TokenPayload = Depends(require_patient),
):
    existing = supabase.table("appointments").select("*").eq("id", appointment_id).eq("patient_id", token.sub).execute()
    if not existing.data:
        raise HTTPException(404, "Appointment not found or not yours.")
    if existing.data[0]["status"] in ("COMPLETED", "CANCELLED"):
        raise HTTPException(400, "Cannot cancel a completed or already cancelled appointment.")
    result = supabase.table("appointments").update({"status": "CANCELLED"}).eq("id", appointment_id).execute()
    return AppointmentResponse(**result.data[0])


@router.get("/doctors", response_model=list[dict])
async def list_doctors(token: TokenPayload = Depends(decode_token)):
    """Returns list of doctors for appointment booking."""
    result = (
        supabase.table("profiles")
        .select("id, full_name, role")
        .eq("role", "DOCTOR")
        .eq("is_active", True)
        .execute()
    )
    return result.data
