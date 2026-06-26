from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import vitals, records, appointments, admin, sms_auth

app = FastAPI(
    title="MedPlatform API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(vitals.router)
app.include_router(records.router)
app.include_router(appointments.router)
app.include_router(admin.router)
app.include_router(sms_auth.router)


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "medplatform-api"}


@app.exception_handler(Exception)
async def global_error(request: Request, exc: Exception):
    import sys
    print(f"[ERROR] {request.url}: {exc}", file=sys.stderr)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})