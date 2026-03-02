"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Header } from "../common/Navbar";
import type { Pkg, PackageType } from "@/types";
import { parseApiError } from "@/utils/helpers";

const API_BASE = "https://fyw-api.atlascard.xyz";

// ---------------------------------------------------------------------------
// Static content
// ---------------------------------------------------------------------------

const SCHEDULE = [
  {
    key: "MON",
    short: "Mon",
    day: "Monday",
    theme: "Corporate Day",
    icon: "business_center",
    color: "bg-slate-800",
    description:
      "Kick off the week in sharp corporate attire. Networking, speeches from alumni, and a formal evening dinner.",
  },
  {
    key: "TUE",
    short: "Tue",
    day: "Tuesday",
    theme: "Denim Day",
    icon: "style",
    color: "bg-blue-700",
    description:
      "Rock your best denim fit. Styled photo ops, music, and a vibrant daytime hangout with your class.",
  },
  {
    key: "WED",
    short: "Wed",
    day: "Wednesday",
    theme: "Costume Day",
    icon: "theater_comedy",
    color: "bg-purple-700",
    description:
      "Dress up as your alter ego. Creative costumes, a best-dressed competition, and non-stop entertainment.",
  },
  {
    key: "THU",
    short: "Thu",
    day: "Thursday",
    theme: "Jersey Day",
    icon: "sports",
    color: "bg-orange-600",
    description:
      "Rep your favourite sports team. Games, inter-house competitions, and lots of energy all day.",
  },
  {
    key: "FRI",
    short: "Fri",
    day: "Friday",
    theme: "Cultural Day / Owambe",
    icon: "celebration",
    color: "bg-[#8B0000]",
    description:
      "The grand finale. Traditional attire, live music, cultural displays, and the biggest Owambe of the year.",
  },
];

const FAQS = [
  {
    q: "Can I upgrade my package later?",
    a: "Yes — you can upgrade to a higher-priced package at any time before the event. Your previously paid amount is preserved and you only pay the difference.",
  },
  {
    q: "Do I have to pay everything at once?",
    a: "No. You can pay in instalments at your own pace. Your registration is confirmed the moment you select a package, and you can top up your balance whenever.",
  },
  {
    q: "For Corporate Plus — can I change my extra day?",
    a: "Yes. You can update your chosen day through your student dashboard before the event begins.",
  },
  {
    q: "What is included in the price?",
    a: "Entry to all events on your selected days, meals, entertainment, and your official ULES FYW invite card.",
  },
  {
    q: "Is this only for engineering students?",
    a: "ULES FYW is organised by the University of Lagos Engineering Society and is open to all final year engineering students.",
  },
];

// ---------------------------------------------------------------------------
// Day chip logic
// ---------------------------------------------------------------------------

type DayState = "fixed" | "choice" | "off";
type DayConfig = { short: string; theme: string; state: DayState };

function getDays(packageType: PackageType | string): DayConfig[] {
  return SCHEDULE.map(({ key, short, theme }) => {
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
// Page
// ---------------------------------------------------------------------------

export default function Packages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1B5E20] px-4 py-20 text-white sm:px-6 sm:py-28">
        {/* Background texture blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-5 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest backdrop-blur">
            ULES Final Year Week 2026
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            The Biggest Week of Your{" "}
            <span className="text-emerald-300">Engineering Journey</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base font-medium text-white/70 sm:text-lg">
            Five days. Five themes. One celebration you will never forget.
            Join your fellow final year engineers for ULES FYW 2026.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#packages"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-[#1B5E20] shadow-lg transition hover:brightness-95"
            >
              View Packages
              <span className="material-symbols-outlined text-base">
                arrow_downward
              </span>
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Register Now
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT IS FYW ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1B5E20]">
              About the Event
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              What is ULES FYW?
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-500">
              Final Year Week (FYW) is the annual celebration organised by the
              University of Lagos Engineering Society (ULES) for graduating
              engineering students. It is the last big hurrah — a week of
              events, themed dress-up days, great food, and memories that stay
              with you long after university.
            </p>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-500">
              Whether you want the full five-day experience or just a couple of
              days, there is a package built exactly for you. All packages
              include your official ULES FYW invite card.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "groups", label: "Final Year Students", sub: "All engineering departments" },
              { icon: "calendar_month", label: "5 Themed Days", sub: "Mon – Fri, May 2026" },
              { icon: "restaurant", label: "Meals Included", sub: "On every event day" },
              { icon: "confirmation_number", label: "Official Invite", sub: "Printed & digital" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
                  {item.icon}
                </span>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {item.label}
                </p>
                <p className="text-xs font-medium text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE WEEK ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Event Schedule
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              The Week at a Glance
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium text-slate-400">
              Five days, five completely different vibes — each one more
              memorable than the last.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SCHEDULE.map((day) => (
              <div
                key={day.key}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${day.color}`}
                >
                  <span className="material-symbols-outlined text-xl text-white">
                    {day.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {day.day}
                  </p>
                  <p className="mt-0.5 font-black text-white">{day.theme}</p>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-400">
                  {day.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ─────────────────────────────────────────────────────── */}
      <section id="packages" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-4 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-[#1B5E20]">
            Pricing
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Package
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-slate-500">
            Pick what works for you. Pay in instalments — your spot is secured
            the moment you register.
          </p>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-slate-500">
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

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[480px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
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
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-black uppercase tracking-widest text-[#1B5E20]">
              FAQ
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Common Questions
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <span className="text-sm font-black text-slate-900">
                    {faq.q}
                  </span>
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-slate-400 transition-transform" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="bg-[#1B5E20] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ready to Secure Your Spot?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm font-medium text-white/70">
            Spots are limited. Register now and pay at your own pace — no need
            to pay in full upfront.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-[#1B5E20] shadow-lg transition hover:brightness-95"
            >
              Register Now
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Already Registered? Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-[#F9FAFB] py-8 text-center text-xs text-slate-400">
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
  const fixedCount = days.filter((d) => d.state === "fixed").length;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg ${
        featured
          ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20"
          : "border-slate-200"
      }`}
    >
      {featured && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-xl bg-[#2D6A4F] px-5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
          Top Choice
        </div>
      )}

      {/* Header band */}
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
                  "flex flex-1 flex-col items-center rounded-lg px-1 py-2.5",
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
          <p className="mt-1.5 text-[10px] font-bold text-slate-400">
            {choiceCount > 0
              ? "Monday always included · pick 1 of Tue / Wed / Thu"
              : fixedCount === 5
              ? "All 5 days included"
              : "Both days fixed — no selection needed"}
          </p>
        </div>

        {/* Benefits */}
        <ul className="mb-7 flex flex-1 flex-col gap-2.5">
          {pkg.benefits.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm font-medium text-slate-700"
            >
              <span className="material-symbols-outlined mt-0.5 text-base text-[#2D6A4F]">
                check
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* CTA — links to registration with package pre-selected */}
        <Link
          href={`/?package=${pkg.code}`}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
            featured
              ? "bg-[#2D6A4F] text-white hover:brightness-110"
              : "bg-emerald-50 text-[#2D6A4F] hover:bg-emerald-100"
          }`}
        >
          Select {pkg.name}
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}
