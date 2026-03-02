"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Header } from "../common/Navbar";
import type { Pkg, PackageType } from "@/types";
import { parseApiError } from "@/utils/helpers";

const API_BASE = "https://fyw-api.atlascard.xyz";

// ---------------------------------------------------------------------------
// Day config
// ---------------------------------------------------------------------------

type DayState = "fixed" | "choice" | "off";

type DayConfig = {
  short: string;
  theme: string;
  state: DayState;
};

const DAY_DEFS = [
  { key: "MON", short: "Mon", theme: "Corporate Day" },
  { key: "TUE", short: "Tue", theme: "Denim Day" },
  { key: "WED", short: "Wed", theme: "Costume Day" },
  { key: "THU", short: "Thu", theme: "Jersey Day" },
  { key: "FRI", short: "Fri", theme: "Cultural Day" },
];

function getDays(packageType: PackageType | string): DayConfig[] {
  return DAY_DEFS.map(({ key, short, theme }) => {
    let state: DayState = "off";
    if (packageType === "FULL") {
      state = "fixed";
    } else if (packageType === "CORPORATE_OWAMBE") {
      if (key === "MON" || key === "FRI") state = "fixed";
    } else if (packageType === "CORPORATE_PLUS") {
      if (key === "MON") state = "fixed";
      else if (key !== "FRI") state = "choice";
    }
    return { short, theme, state };
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Packages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packages.length > 0) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/students/packages`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(parseApiError(res.status, body));
        }
        return res.json();
      })
      .then((json) => setPackages(json?.data ?? json))
      .catch((e: any) => setError(e?.message ?? "Failed to load packages"))
      .finally(() => setLoading(false));
  }, [packages.length]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full bg-[#1B5E20]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#1B5E20]">
            ULES Final Year Week 2026
          </span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Choose Your Experience
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base font-medium text-slate-500">
            Pick the package that fits you. All packages include access to
            events, meals, and memories that last a lifetime.
          </p>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[#1B5E20]" />
              Included
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-[#1B5E20]" />
              Your choice
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-slate-200" />
              Not included
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-10 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[460px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <PackageCard key={p._id} pkg={p} featured={p.code === "F"} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && packages.length > 0 && (
          <div className="mt-16 text-center">
            <p className="mb-4 text-sm font-medium text-slate-500">
              Ready to secure your spot for the biggest week of the year?
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B5E20] px-8 py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition hover:brightness-110"
            >
              Register Now
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </Link>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Already registered?{" "}
              <Link href="/login" className="font-bold text-[#1B5E20]">
                Check your status
              </Link>
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <span className="font-bold text-[#1B5E20]">Built by Korex</span>
        <span className="ml-2">© 2026 ULES</span>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package card
// ---------------------------------------------------------------------------

function PackageCard({ pkg, featured }: { pkg: Pkg; featured?: boolean }) {
  const days = getDays(pkg.packageType);
  const choiceCount = days.filter((d) => d.state === "choice").length;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg ${
        featured ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20" : "border-slate-200"
      }`}
    >
      {featured && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-xl bg-[#2D6A4F] px-5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
          Top Choice
        </div>
      )}

      {/* Card header */}
      <div
        className={`px-6 pb-5 pt-8 ${
          featured ? "bg-[#2D6A4F] text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                featured ? "text-white/50" : "text-slate-400"
              }`}
            >
              Package {pkg.code}
            </p>
            <h3 className="mt-0.5 text-xl font-black leading-tight">
              {pkg.name}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black leading-none">
              ₦{(pkg.price / 1000).toFixed(0)}k
            </p>
            <p
              className={`mt-0.5 text-[11px] font-medium ${
                featured ? "text-white/50" : "text-slate-400"
              }`}
            >
              one-time
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Day chips */}
        <div className="mb-6">
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Days Included
          </p>
          <div className="flex gap-1.5">
            {days.map((d) => (
              <div
                key={d.short}
                title={`${d.short} — ${d.theme}`}
                className={[
                  "flex flex-1 flex-col items-center rounded-lg px-1 py-2.5 transition",
                  d.state === "fixed"
                    ? "bg-[#1B5E20] text-white"
                    : d.state === "choice"
                    ? "border-2 border-dashed border-[#1B5E20] bg-[#1B5E20]/5 text-[#1B5E20]"
                    : "bg-slate-100 text-slate-300",
                ].join(" ")}
              >
                <span className="text-[9px] font-black uppercase">
                  {d.short}
                </span>
              </div>
            ))}
          </div>
          {choiceCount > 0 ? (
            <p className="mt-1.5 text-[10px] font-bold text-slate-400">
              Monday always included · pick 1 of Tue / Wed / Thu
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] font-bold text-slate-400">
              {days.filter((d) => d.state === "fixed").length === 5
                ? "All 5 days included"
                : "Both days fixed — no selection needed"}
            </p>
          )}
        </div>

        {/* Benefits */}
        <ul className="mb-7 flex flex-1 flex-col gap-2.5">
          {pkg.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm font-medium text-slate-700">
              <span className="material-symbols-outlined mt-0.5 text-base text-[#2D6A4F]">
                check
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/"
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
            featured
              ? "bg-[#2D6A4F] text-white hover:brightness-110"
              : "bg-emerald-50 text-[#2D6A4F] hover:bg-emerald-100"
          }`}
        >
          Get Started
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}
