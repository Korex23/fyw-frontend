"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../common/Navbar";
import { Field } from "../common/Input";
import { useRouter, useSearchParams } from "next/navigation";
import type { Pkg } from "@/types";
import { parseApiError } from "@/utils/helpers";

type Step = 1 | 2;

type IdentifyPayload = {
  matricNumber: string;
  fullName: string;
  gender: "male" | "female" | "";
  email?: string;
};

type Student = {
  _id: string;
  matricNumber: string;
  fullName: string;
  email?: string;
  packageId?: string;
  totalPaid?: number;
  paymentStatus?: "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";
};

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

const PICKER_DAYS: { label: string; value: Weekday }[] = [
  { label: "Tuesday (Denim Day)", value: "TUESDAY" },
  { label: "Wednesday (Costume Day)", value: "WEDNESDAY" },
  { label: "Thursday (Jersey Day)", value: "THURSDAY" },
];

const API_BASE = "https://fyw-api.atlascard.xyz";

const PACKAGE_LABELS: Record<string, string> = {
  T: "Corporate Plus — ₦30,000",
  C: "Corporate & Owambe — ₦40,000",
  F: "Full Experience — ₦60,000",
};

export default function StudentRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCode = searchParams.get("package")?.toUpperCase() ?? null;

  useEffect(() => {
    const stored = localStorage.getItem("fyw_matric");
    if (stored) {
      router.replace(`/dashboard/${encodeURIComponent(stored)}`);
    }
  }, [router]);

  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState<IdentifyPayload>({
    matricNumber: "",
    fullName: "",
    gender: "",
    email: "",
  });

  const [student, setStudent] = useState<Student | null>(null);

  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submittingPackage, setSubmittingPackage] = useState<string | null>(
    null,
  );

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEW: state for "T" package day selection
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([]);
  const [daysError, setDaysError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    return (
      form.matricNumber.trim().length >= 6 &&
      form.fullName.trim().length >= 3 &&
      (form.gender === "male" || form.gender === "female")
    );
  }, [form.matricNumber, form.fullName, form.gender]);

  const canSelectT = selectedDays.length === 1;

  // Fetch packages ONLY when we enter step 2
  useEffect(() => {
    if (step !== 2) return;
    if (packages.length > 0) return;

    const fetchPackages = async () => {
      setError(null);
      setLoadingPackages(true);

      try {
        const response = await fetch(`${API_BASE}/api/students/packages`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch packages: ${response.status} ${response.statusText}`,
          );
        }

        const json = await response.json();
        const pkgs: Pkg[] = json?.data ?? json;
        setPackages(pkgs);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load packages");
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [step, packages.length]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    setError(null);
    setStep(2);
  };

  function toggleDay(day: Weekday) {
    setDaysError(null);
    setSelectedDays((prev) => {
      if (prev.includes(day)) return [];
      return [day];
    });
  }

  // Step 2 select: call identify with selected package
  const handleSelectPackage = async (pkg: Pkg) => {
    setError(null);
    setDaysError(null);

    if (pkg.code === "T" && selectedDays.length !== 1) {
      setDaysError("Please select exactly one additional day (Tuesday, Wednesday, or Thursday).");
      return;
    }

    setSubmittingPackage(pkg._id);
    setLoadingIdentify(true);

    try {
      const response = await fetch(`${API_BASE}/api/students/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNumber: form.matricNumber.trim(),
          fullName: form.fullName.trim(),
          gender: form.gender,
          email: form.email?.trim() || undefined,
          packageCode: pkg.code,
          ...(pkg.code === "T" ? { selectedDays } : {}),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(parseApiError(response.status, body));
      }

      const json = await response.json();
      const st = json?.data ?? json?.student ?? json;

      console.log(st.student.matricNumber);

      setStudent(st.student.matricNumber);

      localStorage.setItem("fyw_matric", st.student.matricNumber);
      router.push(`/dashboard/${encodeURIComponent(st.student.matricNumber)}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register/select package");
    } finally {
      setSubmittingPackage(null);
      setLoadingIdentify(false);
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

          <div className="mb-6 w-full max-w-7xl">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 backdrop-blur">
              <StepPill
                active={step === 1}
                label="Step 1"
                text="Your Details"
              />
              <div className="h-px flex-1 bg-slate-200" />
              <StepPill
                active={step === 2}
                label="Step 2"
                text="Select Package"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 w-full max-w-7xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="w-full max-w-[500px] rounded-2xl border border-slate-100 bg-white p-4 pb-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] md:p-12">
              <div className="mb-10 text-center">
                <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-800">
                  ULES FYW PAY
                </h1>
                <p className="mx-auto max-w-sm text-sm font-medium text-slate-500 md:text-base">
                  University of Lagos Engineering Society <br />
                  Final Year Week Student Portal
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleContinue}>
                <Field
                  label="Matric Number"
                  icon="fingerprint"
                  placeholder="e.g. 190401001"
                  name="matricNumber"
                  value={form.matricNumber}
                  onChange={(e: any) =>
                    setForm((p) => ({ ...p, matricNumber: e.target.value }))
                  }
                />

                <Field
                  label="Full Name"
                  icon="person"
                  placeholder="Enter your full name as per student ID"
                  name="fullName"
                  value={form.fullName}
                  onChange={(e: any) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                />

                {/* Gender */}
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-700">
                    Gender <span className="text-red-500">*</span>
                  </p>
                  <div className="flex gap-3">
                    {(["male", "female"] as const).map((g) => (
                      <label
                        key={g}
                        className={[
                          "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold capitalize transition",
                          form.gender === g
                            ? "border-[#1B5E20] bg-[#1B5E20]/10 text-[#1B5E20]"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={form.gender === g}
                          onChange={() => setForm((p) => ({ ...p, gender: g }))}
                          className="sr-only"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <Field
                  label="Email Address"
                  icon="mail"
                  placeholder="Enter your email address"
                  name="email"
                  value={form.email}
                  onChange={(e: any) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />

                {preSelectedCode && PACKAGE_LABELS[preSelectedCode] && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-base text-[#1B5E20]">
                      check_circle
                    </span>
                    <span className="font-medium text-emerald-800">
                      Pre-selected:{" "}
                      <span className="font-black">
                        {PACKAGE_LABELS[preSelectedCode]}
                      </span>
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canContinue}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E20] py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>

                <p className="mb-5 text-[14px] font-bold tracking-[0.05em] text-slate-400">
                  Started Payment Already?{" "}
                  <Link href={"/login"} className="text-[#1b5e20]">
                    Login
                  </Link>
                </p>
              </form>

              {/* <Partners /> */}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="w-full max-w-7xl">
              <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Student
                    </p>
                    <p className="text-lg font-bold text-slate-800">
                      {form.fullName}
                      <span className="ml-2 text-sm font-semibold text-slate-500">
                        ({form.matricNumber})
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    disabled={loadingIdentify || submittingPackage !== null}
                  >
                    <span className="material-symbols-outlined text-lg">
                      arrow_back
                    </span>
                    Edit Details
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      Select Your Package
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Selecting a package will complete your registration.
                    </p>
                  </div>

                  {loadingIdentify && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                      <span className="material-symbols-outlined animate-spin text-base">
                        progress_activity
                      </span>
                      Saving selection...
                    </div>
                  )}
                </div>

                {/* Day picker — Corporate Plus (T) only */}
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Select One Additional Day
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Required for{" "}
                        <span className="font-black">Corporate Plus</span>.
                        Monday is always included.
                      </p>
                    </div>

                    <div className="mt-2 text-xs font-bold text-slate-600 sm:mt-0">
                      {selectedDays.length}/1 selected
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="cursor-not-allowed rounded-xl bg-[#1B5E20] px-3 py-2 text-xs font-black uppercase text-white opacity-60">
                      Monday (Corporate Day)
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      + pick one:
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PICKER_DAYS.map((d) => {
                      const active = selectedDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={[
                            "rounded-xl px-3 py-2 text-xs font-black uppercase transition",
                            active
                              ? "bg-[#1B5E20] text-white"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  {daysError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                      {daysError}
                    </div>
                  )}

                  <div className="mt-3 text-[11px] font-bold text-slate-500">
                    Selected:{" "}
                    <span className="text-slate-700">
                      Monday
                      {selectedDays.length
                        ? `, ${selectedDays[0]}`
                        : " (+ one more required for Corporate Plus)"}
                    </span>
                  </div>
                </div>

                {loadingPackages ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[280px] animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {packages.map((p) => (
                      <PackageCard
                        key={p._id}
                        pkg={p}
                        isTopChoice={p.code === "F"}
                        isPreSelected={p.code === preSelectedCode}
                        loading={submittingPackage === p._id}
                        onSelect={() => handleSelectPackage(p)}
                        disabled={p.code === "T" && !canSelectT}
                      />
                    ))}
                  </div>
                )}

                {student && (
                  <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Saved! You can proceed to payment. (Student ID:{" "}
                    <span className="font-bold">{student._id}</span>)
                  </div>
                )}
              </div>
            </div>
          )}

          <footer className="mt-12 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-bold text-[#1B5E20]">Built by Korex</span>
            <span className="font-medium">© 2026 ULES</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function StepPill(props: { active: boolean; label: string; text: string }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-xl px-3 py-2 ${
        props.active ? "bg-[#1B5E20]/10 text-[#1B5E20]" : "text-slate-500"
      }`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        {props.label}
      </span>
      <span className="text-[10px] font-bold">{props.text}</span>
    </div>
  );
}

function PackageCard(props: {
  pkg: Pkg;
  isTopChoice?: boolean;
  isPreSelected?: boolean;
  loading?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const { pkg, isTopChoice, isPreSelected, loading, onSelect, disabled } = props;

  const isDisabled = Boolean(disabled) || Boolean(loading);

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sm transition ${
        isPreSelected
          ? "border-[#1B5E20] ring-2 ring-[#1B5E20]/20"
          : "border-slate-200"
      } ${disabled ? "opacity-70" : ""}`}
    >
      {isPreSelected && !isTopChoice && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1B5E20] px-4 py-1 text-[10px] font-black uppercase text-white">
          Your Pick
        </div>
      )}
      {isTopChoice && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2D6A4F] px-4 py-1 text-[10px] font-black uppercase text-white">
          Top Choice
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900">{pkg.name}</h4>
        <span className="material-symbols-outlined text-[#2D6A4F]">
          check_circle
        </span>
      </div>

      <div className="mb-6 text-3xl font-black text-slate-900">
        ₦{pkg.price.toLocaleString("en-NG")}
      </div>

      <div className="mb-8 flex flex-1 flex-col gap-3">
        {pkg.benefits.map((b) => (
          <div
            key={b}
            className="flex gap-2 text-sm font-medium text-slate-700"
          >
            <span className="material-symbols-outlined text-sm text-[#2D6A4F]">
              check
            </span>
            {b}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={isDisabled}
        className="w-full rounded-lg bg-emerald-50 py-2 text-sm font-bold text-[#2D6A4F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        title={
          pkg.code === "T" && disabled
            ? "Select one additional day before choosing Corporate Plus"
            : undefined
        }
      >
        {loading ? "Saving..." : isPreSelected ? "Confirm Selection" : "Select Package"}
      </button>

      {pkg.code === "T" && disabled && (
        <p className="mt-2 text-[11px] font-bold text-slate-500">
          Select exactly{" "}
          <span className="text-slate-700">one additional day</span> to enable
          this package.
        </p>
      )}
    </div>
  );
}

function Partners() {
  return (
    <div className="mt-6 border-t border-slate-50 pt-8 text-center">
      <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
        Official Partners
      </p>

      <div className="flex items-center justify-center gap-8 grayscale opacity-50 transition-opacity hover:opacity-100">
        <img
          alt="University Logo"
          className="h-10 w-auto object-contain"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPueuRAo8Je10YZgswFW0Vs6kqtrg1w9l2isam8-MNsc6P1Zq6gBipPVyd1FdAv1roikZLPmgRx-XNBgwqEYH4XxB3fX7ITtT7s9K4a8heSN-meYavxqZUWBGgifdoOIm5Ow92Dj74b6mp-Tj2KDq-ga-RRZL_sjuXl2l2193eAJjtDzXCmOSk1w7FiRTk4dEQ-zUiaOOl7lFLl-Jo_lYBFfTzkvKuC-kznlWEUOUueCWQVcYZ8EEYVNRT-DXFRB1SxtWIiBHJ3FM"
        />
        <div className="h-6 w-px bg-slate-200" />
        <img
          alt="Student Union Logo"
          className="h-10 w-auto object-contain"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKluP56YyYOCFG9qIuhLQEp03sKYd85rzU_lNd9KaZ0QGfon9b4GTT5uRYnUzngkUjz6RouXW2OYhNzWeyeUrNYTr0n5-IBG7utLJa55EMeBzo77XDHSugW5s-Dd8RLc7LX4Bha_z7XBldIHliak2BZnnJBHyfUcbG2obVendCa7JMIetDlV_IcQZpRn2qH-7E4_a-EXdfDhhxMS8UsUpJTYjJH7_-Sc2UVFFloY9oxko3ydBn2mWTp8GymgTG366E5Zx2zgdGXD4"
        />
      </div>
    </div>
  );
}
