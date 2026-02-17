"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common/Navbar";
import { formatNaira } from "@/utils/helpers";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:5000";

type ApiPackage = {
  _id: string;
  code: "F" | "T" | string;
  name: string;
  price: number;
  benefits: string[];
};

type Student = {
  _id: string;
  fullName: string;
  matricNumber: string;
  email?: string;
  phone?: string;
  totalPaid: number;
  paymentStatus: "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";
  packageId: ApiPackage;
  invites?: {
    pdfUrl?: string;
    imageUrl?: string;
    generatedAt?: string;
  };
  selectedDays: string[];
};

type StudentStatusResponse = {
  success: boolean;
  data: {
    student: Student;
    package: ApiPackage;
    outstanding: number;
  };
};

export default function DashboardPage() {
  const { matricNumber } = useParams();
  const router = useRouter();

  console.log(matricNumber);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [pkg, setPkg] = useState<ApiPackage | null>(null);
  const [outstanding, setOutstanding] = useState<number>(0);

  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/students/${matricNumber}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) throw new Error("Student not found.");
          const text = await res.text().catch(() => "");
          throw new Error(`Failed: ${res.status} ${res.statusText} ${text}`);
        }

        const json = (await res.json()) as StudentStatusResponse;

        const s = json.data.student;
        const p = json.data.package;
        const o = json.data.outstanding;

        setStudent(s);
        setPkg(p);
        setOutstanding(o);

        // sensible default amount
        setAmount(o > 0 ? Math.min(5000, o) : 0);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [matricNumber]);

  // Clamp amount if outstanding changes
  useEffect(() => {
    setAmount((prev) => Math.min(prev, outstanding));
  }, [outstanding]);

  const totalPaid = student?.totalPaid ?? 0;

  const progressPct = useMemo(() => {
    if (!pkg?.price) return 0;
    const pct = (totalPaid / pkg.price) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [pkg?.price, totalPaid]);

  const canPay = outstanding > 0 && amount > 0 && amount <= outstanding;

  function setPercent(pct: 25 | 50 | 100) {
    const next = Math.round((outstanding * pct) / 100);
    setAmount(next);
  }

  const isFullyPaid = student?.paymentStatus === "FULLY_PAID";

  const onPayNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPay) return;
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: matricNumber,
        amount,
        email: student?.email,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      alert(
        `Payment initialization failed: ${response.status} ${response.statusText} ${text}`,
      );
      return;
    }

    const data = await response.json();

    const authorizationUrl = data?.data?.authorization_url;
    console.log(data);
    console.log(authorizationUrl);

    if (authorizationUrl) {
      window.location.href = authorizationUrl;
    } else {
      alert("Payment initialization failed: No authorization URL returned.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error || !student || !pkg) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Something went wrong."}
          </div>
          <div className="mt-4">
            <Link className="text-sm font-bold text-[#2D6A4F]" href="/login">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6] text-slate-900">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#2D6A4F]"
            onClick={() => {
              router.push("/login");
            }}
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Logout
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Packages &amp; Payment
              </h1>
              <p className="mt-2 text-base text-slate-500 sm:text-lg">
                Welcome, <span className="font-bold">{student.fullName}</span>.
                Track payments and access your invite.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
              <span className="material-symbols-outlined text-base text-[#2D6A4F]">
                verified
              </span>
              {student.paymentStatus.replace("_", " ")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Payment Progress
                  </h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black sm:text-4xl">
                      {formatNaira(totalPaid)}
                    </span>
                    <span className="font-medium text-slate-500">
                      paid of {formatNaira(pkg.price)} total
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#800000]">
                    Outstanding Balance
                  </h3>
                  <div
                    className={`mt-1 text-3xl font-black  ${outstanding > 0 ? "text-[#800000]" : "text-[#2D6A4F]"}  sm:text-4xl`}
                  >
                    {formatNaira(outstanding)}
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="mb-2 flex justify-between text-[10px] font-bold">
                  <span className="uppercase text-[#2D6A4F]">
                    {progressPct}% Completed
                  </span>
                  <span className="uppercase text-slate-400">
                    {formatNaira(outstanding)} Remaining
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2D6A4F] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {isFullyPaid && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Payment complete
                      </p>
                      <p className="text-xs font-medium text-emerald-800/80">
                        Download your invite below.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {student.invites?.pdfUrl && (
                        <a
                          href={student.invites.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm"
                        >
                          PDF Invite
                        </a>
                      )}
                      {student.invites?.imageUrl && (
                        <a
                          href={student.invites.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white"
                        >
                          Image Invite
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isFullyPaid && (
                <form
                  onSubmit={onPayNow}
                  className="border-t border-slate-100 pt-6"
                >
                  <label className="mb-3 block text-sm font-bold text-slate-700">
                    Make a Payment
                  </label>

                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                          ₦
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={outstanding}
                          value={Number.isFinite(amount) ? amount : 0}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) return;
                            setAmount(Math.max(0, Math.min(next, outstanding)));
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-lg font-bold text-slate-900 outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPercent(25)}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPercent(50)}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPercent(100)}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        100%
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!canPay}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-8 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">
                        payments
                      </span>
                      Pay Now
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Maximum payment: {formatNaira(outstanding)}
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Right - Active package */}
          <div className="flex">
            <div className="flex w-full flex-col rounded-xl bg-[#2D6A4F] p-6 text-white shadow-xl shadow-[#2D6A4F]/10 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Selected Package
                </span>
                <span className="material-symbols-outlined">stars</span>
              </div>

              <h3 className="mb-1 text-2xl font-black">{pkg.name}</h3>
              <div className="mb-8 text-4xl font-black">
                ₦{pkg.price.toLocaleString("en-NG")}
              </div>

              <div className="flex flex-col gap-4">
                {pkg.benefits.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-3 text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-lg opacity-80">
                      check_circle
                    </span>
                    {b}
                  </div>
                ))}
                Selected Days: {student.selectedDays.join(", ")}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#2D6A4F]">
              engineering
            </span>
            <p className="text-sm font-medium text-slate-500">
              © 2026 ULES Final Year Week Committee
            </p>
          </div>

          <div className="flex gap-8">
            <Link
              className="text-xs font-bold uppercase text-slate-400 transition-colors hover:text-[#2D6A4F]"
              href="#"
            >
              Help Center
            </Link>
            <Link
              className="text-xs font-bold uppercase text-slate-400 transition-colors hover:text-[#2D6A4F]"
              href="#"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
