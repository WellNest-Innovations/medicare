from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from app.core.config import settings

bearer_scheme = HTTPBearer()


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    app_role: str = "PATIENT"
    exp: int


def decode_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenPayload:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        app_meta = payload.get("app_metadata", {})
        return TokenPayload(
            sub=payload["sub"],
            email=payload.get("email"),
            app_role=app_meta.get("role", "PATIENT"),
            exp=payload["exp"],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_patient(token: TokenPayload = Depends(decode_token)) -> TokenPayload:
    if token.app_role != "PATIENT":
        raise HTTPException(status_code=403, detail="Patients only.")
    return token


def require_doctor(token: TokenPayload = Depends(decode_token)) -> TokenPayload:
    if token.app_role != "DOCTOR":
        raise HTTPException(status_code=403, detail="Doctors only.")
    return token


def require_admin(token: TokenPayload = Depends(decode_token)) -> TokenPayload:
    if token.app_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admins only.")
    return token
