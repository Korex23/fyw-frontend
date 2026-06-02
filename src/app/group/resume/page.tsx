"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Navbar";

export default function GroupResumePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [stored, setStored] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("fyw_group_id");
    setStored(s);
    if (s) setGroupId(s);
  }, []);

  const canGo = groupId.trim().length > 0;

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGo) return;
    router.push(`/group/${encodeURIComponent(groupId.trim())}`);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-800">
      <Header />
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[5%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#1B5E20]/5 blur-[120px]" />
        </div>

        <div className="w-full max-w-[500px] rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] md:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Resume Group Payment
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500">
              Enter your group ID to view status and pay the balance.
            </p>
          </div>

          {stored && (
            <button
              type="button"
              onClick={() => router.push(`/group/${encodeURIComponent(stored)}`)}
              className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
            >
              <span className="text-sm font-bold text-emerald-900">
                Continue your last group
                <span className="block font-mono text-xs font-medium text-emerald-700">
                  {stored}
                </span>
              </span>
              <span className="material-symbols-outlined text-[#1B5E20]">
                arrow_forward
              </span>
            </button>
          )}

          <form className="space-y-5" onSubmit={go}>
            <div>
              <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Group ID
              </label>
              <div className="group relative mt-2">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1B5E20]">
                  groups
                </span>
                <input
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="Paste your group ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 font-medium text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#1B5E20] focus:outline-none focus:ring-4 focus:ring-[#1B5E20]/5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canGo}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E20] py-4 font-bold text-white shadow-lg shadow-[#1B5E20]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              View Group
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-bold tracking-[0.05em] text-slate-400">
            No group yet?{" "}
            <Link href="/group" className="text-[#1B5E20]">
              Register one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
