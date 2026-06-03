"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GROUP_DISCOUNT_PCT,
  GROUP_REGULAR_TOTAL,
  GROUP_TOTAL,
} from "@/types";

const SEEN_KEY = "fyw_group_promo_seen";
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// ---------------------------------------------------------------------------
// Announcement banner — persistent strip at the very top of the page
// ---------------------------------------------------------------------------

export function AnnouncementBanner() {
  return (
    <div className="relative z-[60] bg-gradient-to-r from-[#1B5E20] via-[#2D6A4F] to-[#1B5E20] text-white">
      <div className="mx-auto flex items-center justify-center gap-3 px-10 py-2 text-center text-xs font-semibold sm:text-sm">
        <span className="material-symbols-outlined hidden text-base sm:inline">
          local_offer
        </span>
        <p className="leading-snug">
          <span className="font-black uppercase tracking-wide text-emerald-200">
            Limited-time:
          </span>{" "}
          Register as a group of 3 and save {GROUP_DISCOUNT_PCT}% —{" "}
          {naira(GROUP_TOTAL)} instead of{" "}
          <span className="line-through opacity-70">
            {naira(GROUP_REGULAR_TOTAL)}
          </span>
          .{" "}
          <Link
            href="/group"
            className="font-black underline decoration-emerald-300 underline-offset-2 hover:text-emerald-200"
          >
            Grab the deal →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// First-visit modal — shown once, gated by localStorage
// ---------------------------------------------------------------------------

export function GroupDiscountModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) !== "1") {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function close() {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  // Close on ESC + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-promo-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close offer"
        onClick={close}
        className="absolute inset-0 cursor-default bg-slate-900/70 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header band */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1B5E20] to-[#2D6A4F] px-7 pb-8 pt-9 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <button
            type="button"
            aria-label="Close offer"
            onClick={close}
            className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur">
            <span className="material-symbols-outlined text-sm">schedule</span>
            Limited-time offer
          </span>

          <h2
            id="group-promo-title"
            className="mt-4 text-3xl font-black leading-tight tracking-tight"
          >
            Save {GROUP_DISCOUNT_PCT}% with the Group Package
          </h2>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-black">{naira(GROUP_TOTAL)}</span>
            <span className="text-lg font-bold text-white/60 line-through">
              {naira(GROUP_REGULAR_TOTAL)}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-white/80">
            for 3 friends · the full five-day Experience
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <ul className="flex flex-col gap-3">
            {[
              "Register 3 members at once and lock in the discount",
              "Split the cost — pay in instalments until it's covered",
              "Everyone gets their official ULES FYW invite",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-sm font-medium text-slate-700"
              >
                <span className="material-symbols-outlined mt-0.5 text-base text-[#2D6A4F]">
                  check_circle
                </span>
                {b}
              </li>
            ))}
          </ul>

          <Link
            href="/group"
            onClick={close}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E20] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          >
            Register a Group
            <span className="material-symbols-outlined text-lg">groups</span>
          </Link>
          <button
            type="button"
            onClick={close}
            className="mt-2 w-full py-2 text-center text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
