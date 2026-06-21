from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
import httpx
from functools import lru_cache
from app.core.config import settings

bearer_scheme = HTTPBearer()


@lru_cache()
def get_jwks():
    """Fetches Supabase's public JSON Web Key Set, cached for the process lifetime."""
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = httpx.get(jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    app_role: str = "PATIENT"
    exp: int


def decode_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenPayload:
    token = credentials.credentials
    try:
        # Inspect the unverified header to determine signing algorithm
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # ES256 / RS256 — verify against Supabase's public JWKS
            jwks = get_jwks()
            kid = unverified_header.get("kid")
            key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
            if key is None:
                raise JWTError("Matching JWKS key not found")
            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {e}",
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