"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Navbar";
import { Field } from "@/components/common/Input";

const API_BASE = "https://fyw-api.atlascard.xyz";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    admin: { email: string };
  };
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const emailOk = form.email.trim().includes("@");
    const passOk = form.password.trim().length >= 6;
    return emailOk && passOk;
  }, [form.email, form.password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const json: LoginResponse = await res.json().catch(() => ({}) as any);

      if (!res.ok || !json?.success || !json?.data?.token) {
        throw new Error(json?.message || "Login failed");
      }

      // Store token (simple approach). Later you can switch to HttpOnly cookies.
      localStorage.setItem("admin_token", json.data.token);
      localStorage.setItem("admin_email", json.data.admin.email);

      router.push("/admin/students"); // or /admin/dashboard
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
      <div className="relative flex min-h-screen w-full flex-col">
        <Header />

        <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8">
          {/* Background blobs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[5%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#1B5E20]/5 blur-[120px]" />
            <div className="absolute bottom-[10%] right-[5%] h-[35%] w-[35%] rounded-full bg-[#8B0000]/5 blur-[100px]" />
          </div>

          {/* Card */}
          <div className="w-full max-w-[500px] rounded-2xl border border-slate-100 bg-white p-4 pb-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] md:p-12">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[#1B5E20]">
                <span className="material-symbols-outlined text-4xl">
                  admin_panel_settings
                </span>
              </div>

              <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-800">
                Admin Login
              </h1>
              <p className="mx-auto max-w-sm text-sm font-medium text-slate-500 md:text-base">
                Sign in to manage payments, students, and invitations.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <Field
                label="Email Address"
                icon="mail"
                placeholder="admin@finalyearweek.com"
                name="email"
                value={form.email}
                onChange={(e: any) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />

              {/* If your Field supports type=password props, pass it; otherwise replace Field with an input */}
              <Field
                label="Password"
                icon="lock"
                placeholder="Enter your password"
                name="password"
                value={form.password}
                onChange={(e: any) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                type="password"
              />

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E20] py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.05em] text-slate-400">
                  Student portal?{" "}
                  <Link href="/" className="text-[#1B5E20]">
                    Go to Student
                  </Link>
                </p>

                <p className="text-[10px] font-bold tracking-[0.05em] text-slate-400">
                  Forgot password?{" "}
                  <span className="cursor-not-allowed text-slate-300">
                    Contact super admin
                  </span>
                </p>
              </div>
            </form>

            <div className="mt-10 border-t border-slate-50 pt-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                ULES FYW PAY • Admin Portal
              </p>
            </div>
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
