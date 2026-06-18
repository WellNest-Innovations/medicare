from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from app.middleware.auth import require_patient, TokenPayload
from app.models.schemas import VitalSubmitRequest, VitalResponse, VITAL_UNITS
from app.core.supabase_client import supabase
from app.core.audit import write_audit_log

router = APIRouter(prefix="/vitals", tags=["Vitals"])


@router.post("/submit", response_model=VitalResponse, status_code=201)
async def submit_vital(
    body: VitalSubmitRequest,
    request: Request,
    token: TokenPayload = Depends(require_patient),
):
    row = {
        "patient_id":      token.sub,
        "vital_type":      body.vital_type,
        "value_primary":   body.value_primary,
        "value_secondary": body.value_secondary,
        "unit":            VITAL_UNITS[body.vital_type],
        "measured_at":     (body.measured_at or datetime.now(timezone.utc)).isoformat(),
        "is_offline_sync": body.is_offline_sync,
        "notes":           body.notes,
    }
    result = supabase.table("vitals_logs").insert(row).execute()
    if not result.data:
        raise HTTPException(500, "Failed to save vital.")
    saved = result.data[0]
    write_audit_log(
        actor_id=token.sub, actor_role=token.app_role, action="VITALS_SUBMIT",
        target_table="vitals_logs", target_id=saved["id"],
        patient_context=token.sub,
        ip_address=request.client.host if request.client else None,
        metadata={"vital_type": body.vital_type, "value": body.value_primary},
    )
    return VitalResponse(**saved)


@router.get("/my", response_model=list[VitalResponse])
async def get_my_vitals(
    vital_type: str | None = None,
    limit: int = 60,
    token: TokenPayload = Depends(require_patient),
):
    q = (
        supabase.table("vitals_logs")
        .select("*")
        .eq("patient_id", token.sub)
        .order("measured_at", desc=True)
        .limit(limit)
    )
    if vital_type:
        q = q.eq("vital_type", vital_type)
    result = q.execute()
    return [VitalResponse(**r) for r in result.data]
