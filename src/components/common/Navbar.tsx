"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close when clicking outside the mobile panel
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex items-center justify-between px-4 py-4 md:px-10">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center text-[#1B5E20]">
            <span className="material-symbols-outlined text-3xl">
              engineering
            </span>
          </div>

          <h2 className="text-lg font-bold tracking-tight text-[#1B5E20] sm:text-xl">
            ULES FYW PAY
          </h2>
        </div>

        {/* Desktop nav
        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-9">
            <Link
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#1B5E20]"
              href="#"
            >
              Home
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#1B5E20]"
              href="#"
            >
              Packages
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#1B5E20]"
              href="#"
            >
              Contact
            </Link>
          </nav>

          <button className="flex h-10 min-w-[84px] items-center justify-center rounded-lg bg-[#1B5E20] px-6 text-sm font-bold tracking-wide text-white shadow-md shadow-[#1B5E20]/10 transition-all hover:brightness-110">
            Support
          </button>
        </div> */}

        {/* Mobile toggle */}
        {open && (
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          >
            <span className="material-symbols-outlined text-2xl">
              {open ? "close" : "menu"}
            </span>
          </button>
        )}
        {!open && (
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          >
            <span className="material-symbols-outlined text-2xl">
              {open ? "close" : "menu"}
            </span>
          </button>
        )}
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden ${
          open ? "block" : "hidden"
        } border-t border-slate-200 bg-white/95`}
      >
        <div ref={panelRef} className="px-4 py-4">
          <nav className="flex flex-col gap-2">
            <Link
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1B5E20]"
              href="#"
            >
              Home
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1B5E20]"
              href="#"
            >
              Packages
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#1B5E20]"
              href="#"
            >
              Contact
            </Link>
          </nav>

          <button
            onClick={() => setOpen(false)}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-[#1B5E20] px-6 text-sm font-bold tracking-wide text-white shadow-md shadow-[#1B5E20]/10 transition-all hover:brightness-110"
          >
            Support
          </button>
        </div>
      </div>
    </header>
  );
}
