import sys
from app.core.supabase_client import supabase


def write_audit_log(
    actor_id: str,
    actor_role: str,
    action: str,
    target_table: str | None = None,
    target_id: str | None = None,
    patient_context: str | None = None,
    ip_address: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Writes an immutable audit log entry. Never raises — logs to stderr on failure."""
    try:
        supabase.table("audit_logs").insert({
            "actor_id":        actor_id,
            "actor_role":      actor_role,
            "action":          action,
            "target_table":    target_table,
            "target_id":       target_id,
            "patient_context": patient_context,
            "ip_address":      ip_address,
            "metadata":        metadata or {},
        }).execute()
    except Exception as e:
        print(f"[AUDIT FAIL] {action} by {actor_id}: {e}", file=sys.stderr)
