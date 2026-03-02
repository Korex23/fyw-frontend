"use client";

import { Pkg } from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { Header } from "../common/Navbar";

const API_BASE = "https://fyw-api.atlascard.xyz";

const Packages = () => {
  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submittingPackage, setSubmittingPackage] = useState<string | null>(
    null,
  );

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [packages.length]);
  return (
    <>
      <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
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
                  loading={submittingPackage === p._id}
                  onSelect={() => p}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

function PackageCard(props: {
  pkg: Pkg;
  isTopChoice?: boolean;
  loading?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const { pkg, isTopChoice, loading, onSelect, disabled } = props;

  const isDisabled = Boolean(disabled) || Boolean(loading);

  return (
    <div
      className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${
        disabled ? "opacity-70" : ""
      }`}
    >
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
        {loading ? "Saving..." : "Select Package"}
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

export default Packages;
