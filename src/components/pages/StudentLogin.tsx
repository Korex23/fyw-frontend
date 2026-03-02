"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../common/Navbar";
import { Field } from "../common/Input";
import { parseApiError } from "@/utils/helpers";

const API_BASE = "https://fyw-api.atlascard.xyz";

export default function StudentLogin() {
  const router = useRouter();

  const [matricNumber, setMatricNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Auto-login if a session is stored
  useEffect(() => {
    const stored = localStorage.getItem("fyw_matric");
    if (stored) {
      setRedirecting(true);
      router.replace(`/dashboard/${encodeURIComponent(stored)}`);
    }
  }, [router]);

  const canSubmit = matricNumber.trim().length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/students/${matricNumber}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(parseApiError(res.status, body));
      }

      // Optional: validate shape, but we mainly use this as existence check here
      await res.json();

      localStorage.setItem("fyw_matric", matricNumber.trim());
      router.push(`/dashboard/${encodeURIComponent(matricNumber.trim())}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to check status");
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#1B5E20]">
            progress_activity
          </span>
          <p className="text-sm font-bold">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
      <div className="relative flex min-h-screen w-full flex-col">
        <Header />

        <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[5%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#1B5E20]/5 blur-[120px]" />
            <div className="absolute bottom-[10%] right-[5%] h-[35%] w-[35%] rounded-full bg-[#8B0000]/5 blur-[100px]" />
          </div>

          {error && (
            <div className="mb-4 w-full max-w-[500px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="w-full max-w-[500px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] md:p-12">
            <div className="mb-10 text-center">
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-800">
                ULES FYW PAY
              </h1>
              <p className="mx-auto max-w-sm text-sm font-medium text-slate-500 md:text-base">
                University of Lagos Engineering Society <br />
                Final Year Week Student Portal
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Field
                label="Matric Number"
                icon="fingerprint"
                placeholder="e.g. 190401001"
                name="matricNumber"
                value={matricNumber}
                onChange={(e: any) => setMatricNumber(e.target.value)}
              />

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E20] py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Checking..." : "Check Status"}</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              <p className="mb-5 text-[14px] font-bold tracking-[0.05em] text-slate-400">
                Not Started Paying?{" "}
                <Link href={"/register"} className="text-[#1b5e20]">
                  Get Started
                </Link>
              </p>
            </form>
          </div>

          <footer className="mt-12 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-bold text-[#1B5E20]">Built by Korex</span>
            <span className="font-medium">© 2026 ULES</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
