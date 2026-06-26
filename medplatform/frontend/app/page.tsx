"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile) return;
    const routes: Record<string, string> = {
      PATIENT: "/dashboard/patient",
      DOCTOR: "/dashboard/doctor",
      CHV: "/dashboard/chv",
      ADMIN: "/dashboard/admin",
    };
    router.replace(routes[profile.role] || "/login");
  }, [user, profile, loading, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="spinner" />
    </div>
  );
}
