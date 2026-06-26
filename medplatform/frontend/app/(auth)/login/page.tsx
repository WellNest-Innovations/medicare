"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthMethod = "email" | "phone";
type PhoneStep = "enter_phone" | "enter_otp";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [phoneStep, setStep] = useState<PhoneStep>("enter_phone");

  // Email fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpExpiry, setExpiry] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Email login ─────────────────────────────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    const routes: Record<string, string> = {
      PATIENT: "/dashboard/patient",
      DOCTOR: "/dashboard/doctor",
      CHV: "/dashboard/chv",
      ADMIN: "/dashboard/admin",
    };
    router.push(routes[profile?.role || "PATIENT"]);
  }

  // ── Phone: send OTP ─────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/sms/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setExpiry(data.expires_in);
      setStep("enter_otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // ── Phone: verify OTP ────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/sms/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");

      // Set session in Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user_id)
        .single();
      const routes: Record<string, string> = {
        PATIENT: "/dashboard/patient",
        DOCTOR: "/dashboard/doctor",
        CHV: "/dashboard/chv",
        ADMIN: "/dashboard/admin",
      };
      router.push(routes[profile?.role || "PATIENT"]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(74,222,128,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <Heart size={24} color="var(--accent-green)" />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            WellNest Health
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Nyanza Region Medical Records
          </p>
        </div>

        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            padding: "1.75rem",
          }}
        >
          {/* Method toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--surface-raised)",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "1.5rem",
              gap: "4px",
            }}
          >
            {(["email", "phone"] as AuthMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMethod(m);
                  setError("");
                  setStep("enter_phone");
                }}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.83rem",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  background:
                    method === m ? "var(--surface-card)" : "transparent",
                  color:
                    method === m ? "var(--text-primary)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {m === "email" ? (
                  <>
                    <Mail size={13} />
                    Email
                  </>
                ) : (
                  <>
                    <Phone size={13} />
                    Phone / SMS
                  </>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: "1rem" }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* ── Email form ── */}
          {method === "email" && (
            <form
              onSubmit={handleEmailLogin}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="label">Email address</label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={15}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="email"
                    className="input"
                    style={{ paddingLeft: "2.5rem" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="password"
                    className="input"
                    style={{ paddingLeft: "2.5rem" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  "Signing in…"
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Phone Step 1: enter number ── */}
          {method === "phone" && phoneStep === "enter_phone" && (
            <form
              onSubmit={handleSendOTP}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="label">Phone Number</label>
                <div style={{ position: "relative" }}>
                  <Phone
                    size={15}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="tel"
                    className="input"
                    style={{ paddingLeft: "2.5rem" }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254722000000 or 0722000000"
                    required
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                  }}
                >
                  Enter your Kenyan phone number. We'll send a 6-digit code via
                  SMS.
                </p>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  "Sending code…"
                ) : (
                  <>
                    <MessageSquare size={15} />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Phone Step 2: enter OTP ── */}
          {method === "phone" && phoneStep === "enter_otp" && (
            <form
              onSubmit={handleVerifyOTP}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  background: "var(--surface-input)",
                  borderRadius: "10px",
                  padding: "0.875rem",
                  fontSize: "0.83rem",
                  color: "var(--text-secondary)",
                }}
              >
                Code sent to{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {phone}
                </strong>
                . Valid for {Math.floor(otpExpiry / 60)} minutes.
              </div>
              <div>
                <label className="label">6-Digit Code</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  style={{
                    fontSize: "1.5rem",
                    letterSpacing: "0.3em",
                    textAlign: "center",
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  "Verifying…"
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("enter_phone");
                  setOtp("");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.83rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Use a different number
              </button>
            </form>
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: "0.83rem",
              color: "var(--text-muted)",
              marginTop: "1.25rem",
            }}
          >
            No account?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--accent-green)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Register here
            </Link>
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginTop: "1.25rem",
          }}
        >
          HIPAA · GDPR · Kenya Data Protection Act compliant
        </p>
      </div>
    </div>
  );
}
