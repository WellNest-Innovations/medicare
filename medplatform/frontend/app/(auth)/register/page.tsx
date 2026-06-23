"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success)
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
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            padding: "2rem",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <CheckCircle size={26} color="var(--accent-green)" />
          </div>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            We sent a confirmation link to{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {form.email}
            </strong>
            . Click it to activate your account.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              marginTop: "1.5rem",
              color: "var(--accent-green)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go to Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );

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
      <div style={{ width: "100%", maxWidth: "400px" }}>
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
            Create account
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            WellNest Health · Nyanza Region
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
          {error && (
            <div className="alert-error" style={{ marginBottom: "1rem" }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}
          <form
            onSubmit={handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
                placeholder="e.g. Akinyi Odhiambo"
                required
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min 8 characters"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "0.25rem" }}
            >
              {loading ? (
                "Creating account…"
              ) : (
                <>
                  <span>Create Account</span>
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
            Already registered?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--accent-green)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
