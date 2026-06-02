"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../common/Navbar";
import { formatNaira, parseApiError } from "@/utils/helpers";
import type { GroupStatus, PaymentStatus } from "@/types";

const API_BASE = "https://fyw-api.blessedbid.com";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string }> = {
  FULLY_PAID: { label: "Fully Paid", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  NOT_PAID: { label: "Not Paid", cls: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function GroupStatusPage() {
  const params = useParams();
  const groupId = params?.groupId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupStatus | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [attributeEmail, setAttributeEmail] = useState<string>("");
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [showPayDisclaimer, setShowPayDisclaimer] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyGroupId = async () => {
    try {
      await navigator.clipboard.writeText(groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — id is shown for manual copy */
    }
  };

  const fetchStatus = useMemo(
    () =>
      async function fetchStatus() {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `${API_BASE}/api/group/${encodeURIComponent(groupId)}`,
            { cache: "no-store" },
          );
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json?.success) {
            throw new Error(parseApiError(res.status, json));
          }
          const data: GroupStatus = json.data;
          setGroup(data);
          // remember for resume
          localStorage.setItem("fyw_group_id", data.groupId);
          // sensible default payment = full outstanding
          setAmount(data.outstanding);
          // default attribution to payer email
          setAttributeEmail((prev) => prev || data.payerEmail);
        } catch (e: any) {
          setError(e?.message ?? "Failed to load group status.");
        } finally {
          setLoading(false);
        }
      },
    [groupId],
  );

  useEffect(() => {
    if (!groupId) return;
    // returning from a payment? clear the pending marker.
    localStorage.removeItem("fyw_pending_group");
    fetchStatus();
  }, [groupId, fetchStatus]);

  const outstanding = group?.outstanding ?? 0;
  const totalAmount = group?.totalAmount ?? 0;
  const totalPaid = group?.totalPaid ?? 0;
  const isFullyPaid = group?.paymentStatus === "FULLY_PAID";

  const progressPct = useMemo(() => {
    if (!totalAmount) return 0;
    return Math.max(0, Math.min(100, Math.round((totalPaid / totalAmount) * 100)));
  }, [totalAmount, totalPaid]);

  const emailOptions = useMemo(() => {
    if (!group) return [];
    const set = new Set<string>();
    if (group.payerEmail) set.add(group.payerEmail);
    group.members.forEach((m) => {
      if (m.email) set.add(m.email);
    });
    return Array.from(set);
  }, [group]);

  const canPay = outstanding > 0 && amount > 0 && amount <= outstanding;

  function setPercent(pct: 50 | 100) {
    setAmount(Math.max(1, Math.round((outstanding * pct) / 100)));
  }

  const onPayNow = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    if (!canPay) return;
    setShowPayDisclaimer(true);
  };

  const proceedToPayment = async () => {
    setShowPayDisclaimer(false);
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/group/${encodeURIComponent(groupId)}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            payerEmail: attributeEmail || group?.payerEmail,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(parseApiError(res.status, json));
      }
      const url = json?.data?.authorization_url;
      if (!url) throw new Error("Payment started but no checkout URL was returned.");
      // mark this return as a group payment for the verify page
      localStorage.setItem("fyw_pending_group", groupId);
      localStorage.setItem("fyw_group_id", groupId);
      window.location.href = url;
    } catch (e: any) {
      setPayError(e?.message ?? "Failed to start payment.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Group not found."}
          </div>
          <div className="mt-4 flex gap-4">
            <Link className="text-sm font-bold text-[#2D6A4F]" href="/group">
              Register a new group
            </Link>
            <Link className="text-sm font-bold text-slate-500" href="/group/resume">
              Resume another group
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badge = STATUS_CONFIG[group.paymentStatus];

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6] text-slate-900">
      {showPayDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <span className="material-symbols-outlined">info</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">Before You Pay</h2>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              When you are redirected to the payment page, the account name you will
              see is <span className="font-black text-slate-900">Cambiar Technologies</span>.
              This is correct — please do not be alarmed if it does not display
              &quot;ULES Final Year Week&quot;. Cambiar Technologies is the registered
              business name for this payment.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPayDisclaimer(false)}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={proceedToPayment}
                className="rounded-lg bg-[#2D6A4F] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                I understand — Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Group Payment
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Payer: <span className="font-bold text-slate-700">{group.payerEmail}</span>
            </p>

            {/* Group ID — save this to resume payment later */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Group ID
              </span>
              <code className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-700 shadow-sm">
                {group.groupId}
              </code>
              <button
                type="button"
                onClick={copyGroupId}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                aria-label="Copy group ID"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
              Save this ID — use it on the{" "}
              <Link href="/group/resume" className="font-bold text-[#2D6A4F] hover:underline">
                resume page
              </Link>{" "}
              to come back and pay the balance.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${badge.cls}`}
          >
            <span className="material-symbols-outlined text-base">
              {isFullyPaid ? "verified" : "schedule"}
            </span>
            {badge.label}
          </span>
        </div>

        {/* Progress card */}
        <div className="flex flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Paid so far
              </h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black sm:text-4xl">
                  {formatNaira(totalPaid)}
                </span>
                <span className="font-medium text-slate-500">
                  of {formatNaira(totalAmount)} total
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#800000]">
                Outstanding
              </h3>
              <div
                className={`mt-1 text-3xl font-black sm:text-4xl ${
                  outstanding > 0 ? "text-[#800000]" : "text-[#2D6A4F]"
                }`}
              >
                {formatNaira(outstanding)}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="mb-2 flex justify-between text-[10px] font-bold">
              <span className="uppercase text-[#2D6A4F]">{progressPct}% Completed</span>
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
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
              <span className="font-bold">Payment complete.</span> All 3 invites have
              been emailed. Each member&apos;s invite is available below.
            </div>
          )}

          {/* Pay panel */}
          {!isFullyPaid && (
            <form onSubmit={onPayNow} className="border-t border-slate-100 pt-6">
              {payError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="material-symbols-outlined mt-0.5 text-base">info</span>
                  <span>{payError}</span>
                </div>
              )}

              <label className="mb-3 block text-sm font-bold text-slate-700">
                Pay the balance (full or part)
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
                    onClick={() => setPercent(50)}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                  >
                    Half
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(outstanding)}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                  >
                    Full
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!canPay || paying}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-8 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">payments</span>
                  {paying ? "Starting..." : "Pay Now"}
                </button>
              </div>

              {/* Attribution */}
              {emailOptions.length > 0 && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Attribute this payment to
                  </label>
                  <select
                    value={attributeEmail}
                    onChange={(e) => setAttributeEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                  >
                    {emailOptions.map((email) => (
                      <option key={email} value={email}>
                        {email}
                        {email === group.payerEmail ? " (payer)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Maximum payment: {formatNaira(outstanding)}. A small processing fee
                applies at the gateway, so the full amount above reaches the group.
              </p>
            </form>
          )}
        </div>

        {/* Members */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Members ({group.members.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {group.members.map((m) => {
              const mBadge = STATUS_CONFIG[m.paymentStatus];
              return (
                <div
                  key={m.matricNumber}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">{m.fullName}</p>
                    <p className="font-mono text-xs text-slate-500">{m.matricNumber}</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                      {m.email || "No email — no invite will be sent"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${mBadge.cls}`}
                  >
                    {mBadge.label}
                  </span>

                  {typeof m.outstanding === "number" && (
                    <p className="text-xs font-medium text-slate-500">
                      <span className="font-bold text-slate-700">
                        {formatNaira(m.totalPaid ?? 0)}
                      </span>{" "}
                      paid ·{" "}
                      <span
                        className={`font-bold ${
                          m.outstanding > 0 ? "text-[#800000]" : "text-[#2D6A4F]"
                        }`}
                      >
                        {formatNaira(m.outstanding)}
                      </span>{" "}
                      left
                    </p>
                  )}

                  {m.hasInvite && m.inviteUrl && (
                    <a
                      href={m.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2D6A4F] hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">
                        confirmation_number
                      </span>
                      View / Download invite
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fetchStatus()}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#2D6A4F]"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh status
          </button>
          <Link href="/group" className="text-sm font-bold text-slate-400 hover:text-[#2D6A4F]">
            Register another group
          </Link>
        </div>
      </main>
    </div>
  );
}
