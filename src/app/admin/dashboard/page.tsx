"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "https://fyw-api.atlascard.xyz";

type Metrics = {
  totalStudents: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  notPaidCount: number;
  totalRevenue: number;
  outstandingTotal: number;
};

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/admin/auth");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/admin/metrics`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_email");
          router.push("/admin/auth");
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to load metrics: ${res.status} ${text}`);
        }

        const json = await res.json();
        setMetrics(json.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token, router]);

  // Still waiting for token check
  if (token === null) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <AdminHeader />

      <main className="px-4 py-8 md:px-10 lg:px-24">
        <div className="mx-auto max-w-[1200px]">
          {/* Page title */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Overview
              </h1>
              <p className="mt-1 text-base text-slate-500">
                Live snapshot of registrations and payments for ULES Final Year
                Week.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>Live</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Stat cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon="groups"
              label="Total Registered"
              value={loading ? null : String(metrics?.totalStudents ?? 0)}
              accent="slate"
            />
            <StatCard
              icon="check_circle"
              label="Fully Paid"
              value={loading ? null : String(metrics?.fullyPaidCount ?? 0)}
              accent="emerald"
            />
            <StatCard
              icon="pending"
              label="Partially Paid"
              value={loading ? null : String(metrics?.partiallyPaidCount ?? 0)}
              accent="amber"
            />
            <StatCard
              icon="cancel"
              label="Not Paid"
              value={loading ? null : String(metrics?.notPaidCount ?? 0)}
              accent="red"
            />
            <StatCard
              icon="payments"
              label="Total Revenue"
              value={loading ? null : formatNaira(metrics?.totalRevenue ?? 0)}
              accent="emerald"
              large
            />
            <StatCard
              icon="account_balance_wallet"
              label="Outstanding"
              value={
                loading ? null : formatNaira(metrics?.outstandingTotal ?? 0)
              }
              accent="red"
              large
            />
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/admin/students"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-[20px]">
                people
              </span>
              View All Students
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */

type Accent = "slate" | "emerald" | "amber" | "red";

const ACCENT_CLASSES: Record<
  Accent,
  { icon: string; dot: string; border: string }
> = {
  slate: {
    icon: "bg-slate-50 text-slate-600 border-slate-100",
    dot: "bg-slate-400",
    border: "",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-800 border-emerald-100",
    dot: "bg-emerald-500",
    border: "",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
    border: "",
  },
  red: {
    icon: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-400",
    border: "",
  },
};

function StatCard(props: {
  icon: string;
  label: string;
  value: string | null;
  accent: Accent;
  large?: boolean;
}) {
  const { icon, label, value, accent, large } = props;
  const cls = ACCENT_CLASSES[accent];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${cls.icon}`}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${cls.dot}`} />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {value === null ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p
            className={`mt-1 font-black tracking-tight text-slate-900 ${
              large ? "text-2xl" : "text-3xl"
            }`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Admin Header ───────────────────────────────────────────────────────────── */

function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    router.push("/admin/auth");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-white">
          <span className="material-symbols-outlined text-[20px]">school</span>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-none tracking-tight text-slate-900">
            Admin Portal
          </h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            ULES FYW PAY
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:gap-8">
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            className="relative text-sm font-bold text-emerald-900 after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:bg-emerald-900 after:content-['']"
            href="/admin/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-900"
            href="/admin/students"
          >
            Students
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
