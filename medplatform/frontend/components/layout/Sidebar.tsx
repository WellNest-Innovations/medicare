"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Heart, LayoutDashboard, FileText, Activity,
  Calendar, Users, ShieldCheck, LogOut, Wifi, WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

const NAV: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  PATIENT: [
    { href: "/dashboard/patient",              label: "Overview",     icon: LayoutDashboard },
    { href: "/dashboard/patient/vitals",       label: "My Vitals",    icon: Activity },
    { href: "/dashboard/patient/records",      label: "My Records",   icon: FileText },
    { href: "/dashboard/patient/appointments", label: "Appointments", icon: Calendar },
  ],
  DOCTOR: [
    { href: "/dashboard/doctor",              label: "Overview",    icon: LayoutDashboard },
    { href: "/dashboard/doctor/patients",     label: "My Patients", icon: Users },
    { href: "/dashboard/doctor/appointments", label: "Schedule",    icon: Calendar },
  ],
  ADMIN: [
    { href: "/dashboard/admin",          label: "Overview",   icon: LayoutDashboard },
    { href: "/dashboard/admin/users",    label: "Users",      icon: Users },
    { href: "/dashboard/admin/audit",    label: "Audit Logs", icon: ShieldCheck },
  ],
};

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const links = NAV[profile?.role || "PATIENT"] || [];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">MedPlatform</p>
            <p className="text-xs text-gray-400">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className={clsx(
        "mx-4 mt-3 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium",
        online ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      )}>
        {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {online ? "Online" : "Offline — data cached"}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
            {profile?.full_name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.role}</p>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 w-full px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
