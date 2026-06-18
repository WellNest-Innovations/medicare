from fastapi import APIRouter, Depends, Request, HTTPException
from app.middleware.auth import require_doctor, require_patient, TokenPayload
from app.models.schemas import RecordAppendRequest, RecordResponse
from app.core.supabase_client import supabase
from app.core.audit import write_audit_log

router = APIRouter(prefix="/records", tags=["Records"])


def _assert_assigned(doctor_id: str, patient_id: str) -> None:
    res = (
        supabase.table("doctor_patient_assignments")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("patient_id", patient_id)
        .eq("is_active", True)
        .execute()
    )
    if not res.data:
        raise HTTPException(403, "You are not assigned to this patient.")


@router.post("/append", response_model=RecordResponse, status_code=201)
async def append_record(
    body: RecordAppendRequest,
    request: Request,
    token: TokenPayload = Depends(require_doctor),
):
    _assert_assigned(token.sub, str(body.patient_id))
    row = {
        "patient_id":  str(body.patient_id),
        "authored_by": token.sub,
        "category":    body.category,
        "title":       body.title,
        "content":     body.content,
    }
    result = supabase.table("medical_records").insert(row).execute()
    if not result.data:
        raise HTTPException(500, "Failed to save record.")
    saved = result.data[0]
    write_audit_log(
        actor_id=token.sub, actor_role=token.app_role, action="RECORD_CREATE",
        target_table="medical_records", target_id=saved["id"],
        patient_context=str(body.patient_id),
        ip_address=request.client.host if request.client else None,
        metadata={"category": body.category, "title": body.title},
    )
    return RecordResponse(**saved)


@router.get("/patient/{patient_id}", response_model=list[RecordResponse])
async def doctor_get_patient_records(
    patient_id: str,
    request: Request,
    token: TokenPayload = Depends(require_doctor),
):
    _assert_assigned(token.sub, patient_id)
    result = (
        supabase.table("medical_records")
        .select("*")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .execute()
    )
    write_audit_log(
        actor_id=token.sub, actor_role=token.app_role, action="RECORD_VIEW",
        target_table="medical_records", patient_context=patient_id,
        ip_address=request.client.host if request.client else None,
        metadata={"count": len(result.data)},
    )
    return [RecordResponse(**r) for r in result.data]


@router.get("/my", response_model=list[RecordResponse])
async def patient_get_own_records(token: TokenPayload = Depends(require_patient)):
    result = (
        supabase.table("medical_records")
        .select("*")
        .eq("patient_id", token.sub)
        .order("created_at", desc=True)
        .execute()
    )
    return [RecordResponse(**r) for r in result.data]
