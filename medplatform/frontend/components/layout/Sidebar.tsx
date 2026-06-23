"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Heart,
  LayoutDashboard,
  FileText,
  Activity,
  Calendar,
  Users,
  ShieldCheck,
  LogOut,
  Wifi,
  WifiOff,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV: Record<
  string,
  { href: string; label: string; icon: React.ElementType }[]
> = {
  PATIENT: [
    { href: "/dashboard/patient", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/patient/vitals", label: "My Vitals", icon: Activity },
    { href: "/dashboard/patient/records", label: "My Records", icon: FileText },
    {
      href: "/dashboard/patient/appointments",
      label: "Appointments",
      icon: Calendar,
    },
  ],
  DOCTOR: [
    { href: "/dashboard/doctor", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/doctor/patients", label: "My Patients", icon: Users },
    {
      href: "/dashboard/doctor/appointments",
      label: "Schedule",
      icon: Calendar,
    },
  ],
  CHV: [
    { href: "/dashboard/chv", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/chv/patients",
      label: "Community List",
      icon: UserCheck,
    },
    { href: "/dashboard/chv/vitals", label: "Log Vitals", icon: Activity },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/audit", label: "Audit Log", icon: ShieldCheck },
  ],
};

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const links = NAV[profile?.role || "PATIENT"] || [];

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--surface-raised)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Heart size={18} color="var(--accent-green)" />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            WellNest
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {profile?.role || "…"}
          </div>
        </div>
      </div>

      <div style={{ padding: "0.75rem 1rem 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            borderRadius: "99px",
            fontSize: "0.72rem",
            fontWeight: 600,
            background: online
              ? "rgba(74,222,128,0.1)"
              : "rgba(252,211,77,0.1)",
            color: online ? "var(--accent-green)" : "var(--accent-amber)",
            border: `1px solid ${
              online ? "rgba(74,222,128,0.25)" : "rgba(252,211,77,0.25)"
            }`,
            width: "fit-content",
          }}
        >
          {online ? (
            <>
              <Wifi size={11} />
              Online
            </>
          ) : (
            <>
              <WifiOff size={11} />
              Offline — queued
            </>
          )}
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.875rem",
                borderRadius: "10px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                background: active ? "rgba(74,222,128,0.12)" : "transparent",
                color: active ? "var(--accent-green)" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{ padding: "1rem", borderTop: "1px solid var(--border-subtle)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--surface-input)",
              border: "1px solid var(--border-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--accent-green)",
              flexShrink: 0,
            }}
          >
            {profile?.full_name?.[0] || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.full_name || "…"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {profile?.role}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
