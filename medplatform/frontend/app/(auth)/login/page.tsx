"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Heart, AlertCircle, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
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
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            Sign in
          </h2>

          {error && (
            <div className="alert-error" style={{ marginBottom: "1rem" }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
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
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "0.25rem" }}
            >
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
