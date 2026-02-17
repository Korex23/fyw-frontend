"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/common/Navbar"; // adjust path if needed
import { Pkg, PackageCode } from "@/types";
import { formatNaira } from "@/utils/helpers";

const PACKAGES: Pkg[] = [
  {
    _id: "11111111",
    code: "A",
    name: "Package A",
    price: 10000,
    benefits: ["Basic Access", "T-Shirt"],
  },
  {
    _id: "11111111",
    code: "B",
    name: "Package B",
    price: 20000,
    benefits: ["Basic Access", "T-Shirt", "Gala Entry"],
  },
  {
    _id: "11111111",
    code: "C",
    name: "Package C",
    price: 35000,
    benefits: ["Full Access", "T-Shirt", "Gala Entry", "Yearbook"],
  },
  {
    _id: "11111111",
    code: "D",
    name: "Package D",
    price: 50000,
    benefits: ["VIP Access", "All Items", "Exclusive Lounge", "Gift Bag"],
    tierLabel: "Premium",
  },
];

export default function PackagesPage() {
  const [activePackage, setActivePackage] = useState<PackageCode>("B");
  const [totalPaid, setTotalPaid] = useState<number>(12000);

  const pkg = useMemo(
    () => PACKAGES.find((p) => p.code === activePackage)!,
    [activePackage],
  );

  const outstanding = useMemo(() => {
    const remaining = pkg.price - totalPaid;
    return remaining > 0 ? remaining : 0;
  }, [pkg.price, totalPaid]);

  const progressPct = useMemo(() => {
    if (pkg.price <= 0) return 0;
    const pct = (totalPaid / pkg.price) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [pkg.price, totalPaid]);

  const [amount, setAmount] = useState<number>(() => {
    // default to a sensible amount
    return outstanding > 0 ? Math.min(5750, outstanding) : 0;
  });

  // Update amount when outstanding changes (e.g. package upgrade)
  // but avoid being annoying; clamp only if above outstanding
  useMemo(() => {
    setAmount((prev) => Math.min(prev, outstanding));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outstanding]);

  const canPay = outstanding > 0 && amount > 0 && amount <= outstanding;

  function setPercent(pct: 25 | 50 | 100) {
    const next = Math.round((outstanding * pct) / 100);
    setAmount(next);
  }

  function isDowngrade(target: PackageCode) {
    const targetPkg = PACKAGES.find((p) => p.code === target)!;
    return targetPkg.price < pkg.price;
  }

  function isUpgrade(target: PackageCode) {
    const targetPkg = PACKAGES.find((p) => p.code === target)!;
    return targetPkg.price > pkg.price;
  }

  function onChoosePackage(code: PackageCode) {
    // Block downgrade
    if (isDowngrade(code)) return;
    setActivePackage(code);

    // keep totalPaid as-is, just recalculates outstanding/progress
    // amount will be clamped by memo above
  }

  function onPayNow(e: React.FormEvent) {
    e.preventDefault();
    if (!canPay) return;

    // For now: simulate a successful payment credit.
    // Replace this with: call backend initialize -> redirect to Paystack -> verify -> refresh.
    setTotalPaid((prev) => Math.min(prev + amount, pkg.price));
    setAmount(0);
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6] text-slate-900">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#2D6A4F]">
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            ULES Student Portal / FYW 2024
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Packages &amp; Payment
              </h1>
              <p className="mt-2 text-base text-slate-500 sm:text-lg">
                Manage your ULES Final Year Week graduation package and track
                your payment progress.
              </p>
            </div>

            {/* optional badge */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 sm:mt-0">
              <span className="material-symbols-outlined text-base text-[#2D6A4F]">
                verified
              </span>
              SECURE PAYMENTS (PAYSTACK)
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
              {/* Progress header */}
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
                  <div className="mt-1 text-3xl font-black text-[#800000] sm:text-4xl">
                    {formatNaira(outstanding)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
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

              {/* Payment form */}
              <form
                onSubmit={onPayNow}
                className="border-t border-slate-100 pt-6"
              >
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Make a Payment
                </label>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {/* Amount input */}
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₦
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={outstanding}
                        value={Number.isFinite(amount) ? amount : 0}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          if (!Number.isFinite(next)) return;
                          setAmount(Math.max(0, Math.min(next, outstanding)));
                        }}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-lg font-bold text-slate-900 outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                      />
                    </div>
                  </div>

                  {/* Quick buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPercent(25)}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 transition-colors hover:bg-slate-50"
                      disabled={outstanding <= 0}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPercent(50)}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 transition-colors hover:bg-slate-50"
                      disabled={outstanding <= 0}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPercent(100)}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 transition-colors hover:bg-slate-50"
                      disabled={outstanding <= 0}
                    >
                      100%
                    </button>
                  </div>

                  {/* Pay */}
                  <button
                    type="submit"
                    disabled={!canPay}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-8 py-3 font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">
                      payments
                    </span>
                    Pay Now
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Maximum payment: {formatNaira(outstanding)} (Remaining
                  balance)
                </p>
              </form>
            </div>
          </div>

          {/* Right column - Active package card */}
          <div className="flex">
            <div className="flex w-full flex-col rounded-xl bg-[#2D6A4F] p-6 text-white shadow-xl shadow-[#2D6A4F]/10 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Active Choice
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
              </div>

              <div className="mt-auto pt-8">
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Selected Package
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All packages */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            All ULES Graduation Packages
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PACKAGES.map((p) => {
              const isActive = p.code === activePackage;
              const downgrade = p.price < pkg.price;
              const upgrade = p.price > pkg.price;

              if (isActive) {
                return (
                  <div
                    key={p.code}
                    className="relative flex flex-col rounded-xl border-2 border-[#2D6A4F] bg-white p-6 ring-4 ring-[#2D6A4F]/5"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2D6A4F] px-4 py-1 text-[10px] font-black uppercase text-white">
                      Your Choice
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">
                        {p.name}
                      </h4>
                      <span className="material-symbols-outlined text-[#2D6A4F]">
                        check_circle
                      </span>
                    </div>

                    <div className="mb-6 text-3xl font-black text-slate-900">
                      ₦{p.price.toLocaleString("en-NG")}
                    </div>

                    <div className="mb-8 flex flex-1 flex-col gap-3">
                      {p.benefits.map((b) => (
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
                      className="w-full cursor-default rounded-lg bg-emerald-50 py-2 text-sm font-bold text-[#2D6A4F]"
                    >
                      Active
                    </button>
                  </div>
                );
              }

              if (downgrade) {
                return (
                  <div
                    key={p.code}
                    className="group relative flex cursor-not-allowed flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 opacity-60"
                  >
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                      <div className="rounded bg-slate-800 px-4 py-2 text-[10px] font-bold uppercase text-white shadow-xl">
                        Downgrade restricted
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">
                        {p.name}
                      </h4>
                      <span className="material-symbols-outlined text-slate-300">
                        lock
                      </span>
                    </div>

                    <div className="mb-6 text-3xl font-black text-slate-900">
                      ₦{p.price.toLocaleString("en-NG")}
                    </div>

                    <div className="mb-8 flex flex-1 flex-col gap-3">
                      {p.benefits.map((b) => (
                        <div
                          key={b}
                          className="flex gap-2 text-sm text-slate-400"
                        >
                          <span className="material-symbols-outlined text-sm">
                            check
                          </span>
                          {b}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-slate-100 py-2 text-sm font-bold text-slate-400"
                    >
                      Unavailable
                    </button>
                  </div>
                );
              }

              // Upgrade or Select (higher package than current)
              return (
                <div
                  key={p.code}
                  className="group flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all hover:border-[#800000]/40"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-[#800000]">
                      {p.name}
                    </h4>

                    {p.tierLabel ? (
                      <span className="rounded bg-[#800000]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#800000]">
                        {p.tierLabel}
                      </span>
                    ) : (
                      upgrade && (
                        <span className="rounded bg-[#800000]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#800000]">
                          Upgrade
                        </span>
                      )
                    )}
                  </div>

                  <div className="mb-6 text-3xl font-black text-slate-900">
                    ₦{p.price.toLocaleString("en-NG")}
                  </div>

                  <div className="mb-8 flex flex-1 flex-col gap-3">
                    {p.benefits.map((b) => (
                      <div
                        key={b}
                        className="flex gap-2 text-sm font-medium text-slate-700"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400 transition-colors group-hover:text-[#800000]">
                          check
                        </span>
                        {b}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onChoosePackage(p.code)}
                    className="w-full rounded-lg border border-[#800000] bg-white py-2 text-sm font-bold text-[#800000] transition-all hover:bg-[#800000] hover:text-white"
                  >
                    {upgrade ? "Upgrade" : "Select"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
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
  );
}
