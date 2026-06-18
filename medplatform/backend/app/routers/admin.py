from fastapi import APIRouter, Depends, Query, HTTPException
from app.middleware.auth import require_admin, TokenPayload
from app.models.schemas import AuditLogListResponse, AuditLogEntry
from app.core.supabase_client import supabase
from app.core.audit import write_audit_log

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: str | None = None,
    actor_role: str | None = None,
    token: TokenPayload = Depends(require_admin),
):
    offset = (page - 1) * page_size
    q = (
        supabase.table("audit_logs")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
    )
    if action:     q = q.eq("action", action)
    if actor_role: q = q.eq("actor_role", actor_role)
    result = q.execute()
    return AuditLogListResponse(
        total=result.count or 0,
        page=page,
        page_size=page_size,
        data=[AuditLogEntry(**r) for r in result.data],
    )


@router.get("/users")
async def list_users(
    role: str | None = None,
    token: TokenPayload = Depends(require_admin),
):
    q = supabase.table("profiles").select("id, full_name, role, is_active, created_at")
    if role: q = q.eq("role", role)
    return q.order("created_at", desc=True).execute().data


@router.patch("/users/{user_id}/role")
async def assign_role(
    user_id: str,
    new_role: str,
    token: TokenPayload = Depends(require_admin),
):
    if new_role not in ("PATIENT", "DOCTOR", "ADMIN"):
        raise HTTPException(400, "Invalid role.")
    supabase.table("profiles").update({"role": new_role}).eq("id", user_id).execute()
    try:
        supabase.auth.admin.update_user_by_id(user_id, {"app_metadata": {"role": new_role}})
    except Exception:
        pass  # JWT will refresh on next login
    write_audit_log(
        actor_id=token.sub, actor_role=token.app_role, action="ROLE_ASSIGN",
        target_table="profiles", target_id=user_id,
        metadata={"new_role": new_role},
    )
    return {"message": f"Role updated to {new_role}"}


@router.post("/assignments")
async def assign_doctor_to_patient(
    doctor_id: str,
    patient_id: str,
    token: TokenPayload = Depends(require_admin),
):
    result = supabase.table("doctor_patient_assignments").insert({
        "doctor_id":   doctor_id,
        "patient_id":  patient_id,
        "assigned_by": token.sub,
    }).execute()
    return result.data[0]
