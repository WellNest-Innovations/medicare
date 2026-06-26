"""
SMS OTP Authentication via Africa's Talking sandbox.
Free tier: works with sandbox credentials, sends to test numbers only.
Production: swap AT_USERNAME to your real AT username and fund account.
"""
import random
import time
import hashlib
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from app.core.supabase_client import supabase

router = APIRouter(prefix="/auth/sms", tags=["SMS Auth"])

# Africa's Talking sandbox credentials
AT_API_KEY  = os.getenv("AT_API_KEY", "")
AT_USERNAME = os.getenv("AT_USERNAME", "sandbox")   # "sandbox" for free testing
AT_SMS_URL  = "https://api.sandbox.africastalking.com/version1/messaging"

# In-memory OTP store (use Redis in production)
# Format: { phone: { otp: str, expires: float, attempts: int } }
_otp_store: dict = {}

OTP_EXPIRY_SECONDS = 300   # 5 minutes
MAX_ATTEMPTS       = 3


class SendOTPRequest(BaseModel):
    phone: str   # E.164 format e.g. +254722000000


class VerifyOTPRequest(BaseModel):
    phone: str
    otp:   str


def _normalize_phone(phone: str) -> str:
    """Ensure phone is in E.164 format."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "+254" + phone[1:]   # Kenya local → E.164
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


async def _send_sms(phone: str, message: str) -> bool:
    """Send SMS via Africa's Talking sandbox."""
    if not AT_API_KEY:
        # No API key set — log OTP to server console for local dev
        print(f"[DEV SMS] To: {phone} | Message: {message}")
        return True
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                AT_SMS_URL,
                data={
                    "username": AT_USERNAME,
                    "to":       phone,
                    "message":  message,
                },
                headers={
                    "apiKey":  AT_API_KEY,
                    "Accept":  "application/json",
                },
                timeout=10,
            )
            return resp.status_code == 201
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        return False


@router.post("/send-otp")
async def send_otp(body: SendOTPRequest):
    """
    Generates a 6-digit OTP and sends it via Africa's Talking.
    Rate limited: max 1 OTP per 60 seconds per phone number.
    """
    phone = _normalize_phone(body.phone)

    # Rate limiting: prevent OTP spam
    existing = _otp_store.get(phone)
    if existing and time.time() - (existing["expires"] - OTP_EXPIRY_SECONDS) < 60:
        raise HTTPException(
            status_code=429,
            detail="Please wait 60 seconds before requesting a new OTP."
        )

    otp = _generate_otp()
    _otp_store[phone] = {
        "otp":      otp,
        "expires":  time.time() + OTP_EXPIRY_SECONDS,
        "attempts": 0,
    }

    message = f"Your WellNest verification code is: {otp}. Valid for 5 minutes. Do not share this code."
    sent = await _send_sms(phone, message)

    if not sent:
        del _otp_store[phone]
        raise HTTPException(status_code=502, detail="Failed to send SMS. Please try again.")

    return {
        "message": f"OTP sent to {phone[-4:].rjust(len(phone), '*')}",
        "expires_in": OTP_EXPIRY_SECONDS,
    }


@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPRequest):
    """
    Verifies the OTP. On success, signs in or creates the Supabase user
    and returns a session token.
    """
    phone = _normalize_phone(body.phone)
    record = _otp_store.get(phone)

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found for this number. Request a new one.")

    if time.time() > record["expires"]:
        del _otp_store[phone]
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")

    record["attempts"] += 1
    if record["attempts"] > MAX_ATTEMPTS:
        del _otp_store[phone]
        raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")

    if body.otp.strip() != record["otp"]:
        remaining = MAX_ATTEMPTS - record["attempts"]
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect OTP. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        )

    # OTP correct — clean up
    del _otp_store[phone]

    # Generate a deterministic email from phone for Supabase Auth
    # (Supabase phone auth requires Twilio; we use email+password internally)
    fake_email    = f"phone_{hashlib.md5(phone.encode()).hexdigest()[:12]}@wellnest.internal"
    fake_password = hashlib.sha256(f"{phone}:{AT_API_KEY or 'dev'}".encode()).hexdigest()

    # Try sign in first
    sign_in = supabase.auth.sign_in_with_password({
        "email":    fake_email,
        "password": fake_password,
    })

    if sign_in.user:
        return {
            "access_token":  sign_in.session.access_token,
            "refresh_token": sign_in.session.refresh_token,
            "user_id":       sign_in.user.id,
            "is_new_user":   False,
        }

    # User doesn't exist — create account
    sign_up = supabase.auth.admin.create_user({
        "email":            fake_email,
        "password":         fake_password,
        "email_confirm":    True,
        "user_metadata":    { "phone_number": phone, "auth_method": "sms_otp" },
    })

    if not sign_up.user:
        raise HTTPException(status_code=500, detail="Failed to create account.")

    # Update profile with phone number
    supabase.table("profiles").update({
        "phone_number": phone,
    }).eq("id", sign_up.user.id).execute()

    # Now sign in to get session
    sign_in2 = supabase.auth.sign_in_with_password({
        "email":    fake_email,
        "password": fake_password,
    })

    return {
        "access_token":  sign_in2.session.access_token,
        "refresh_token": sign_in2.session.refresh_token,
        "user_id":       sign_up.user.id,
        "is_new_user":   True,
    }
