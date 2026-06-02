"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = "https://fyw-api.blessedbid.com";

type PaymentStatus = "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";

type GroupMember = {
  studentId: string;
  fullName: string;
  matricNumber: string;
  email?: string;
  paymentStatus: PaymentStatus;
  share?: number;
  totalPaid: number;
  outstanding?: number;
  hasInvite: boolean;
  inviteUrl?: string | null;
};

type GroupPayment = {
  _id: string;
  amount: number;
  reference: string;
  status: string;
  createdAt?: string;
};

type GroupDetail = {
  _id: string;
  payerEmail: string;
  totalAmount: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  members: GroupMember[];
  payments: GroupPayment[];
  createdAt?: string;
  updatedAt?: string;
};

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(s?: string) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string }> = {
  FULLY_PAID: { label: "Fully Paid", cls: "bg-emerald-50 text-emerald-800" },
  PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-amber-50 text-amber-800" },
  NOT_PAID: { label: "Not Paid", cls: "bg-rose-50 text-rose-800" },
};

export default function AdminGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/admin/auth");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token || !id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/admin/groups/${id}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_email");
          router.push("/admin/auth");
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to load group: ${res.status} ${text}`);
        }

        const json = await res.json();
        setData(json.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [token, id, router]);

  const handleDelete = async () => {
    if (!token || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        router.push("/admin/auth");
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to delete group (${res.status})`);
      }

      const message: string =
        json?.message ?? "Group deleted along with its members and payments.";
      // Hand the success message to the groups list to surface as a toast.
      try {
        sessionStorage.setItem("admin_groups_flash", message);
      } catch {
        /* sessionStorage unavailable — list will just refresh without a toast */
      }
      router.push("/admin/groups");
    } catch (e: any) {
      setDeleteError(e?.message ?? "Failed to delete group");
      setDeleting(false);
    }
  };

  if (token === null) return null;

  const outstanding = data ? Math.max(0, data.totalAmount - data.totalPaid) : 0;
  const progressPct = data && data.totalAmount
    ? Math.max(0, Math.min(100, Math.round((data.totalPaid / data.totalAmount) * 100)))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">Delete this group?</h2>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              This permanently deletes the group registration, all{" "}
              <span className="font-black text-slate-900">
                {data?.members.length ?? 3}
              </span>{" "}
              member student record(s), and their payments. This action{" "}
              <span className="font-black text-red-700">cannot be undone</span>.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete group
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminHeader />

      <main className="px-4 py-8 md:px-10 lg:px-24">
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/admin/groups"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-emerald-900"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Groups
          </Link>

          {loading && (
            <div className="mt-4 space-y-4 animate-pulse">
              <div className="h-40 rounded-xl bg-slate-200" />
              <div className="h-48 rounded-xl bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-200" />
            </div>
          )}

          {!loading && error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && data && (
            <div className="mt-4 space-y-6">
              {/* Header / progress */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Payer
                    </p>
                    <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                      {data.payerEmail}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-slate-400">{data._id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                        STATUS_CONFIG[data.paymentStatus]?.cls ??
                        "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {STATUS_CONFIG[data.paymentStatus]?.label ?? data.paymentStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setShowDeleteConfirm(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                      Delete group
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-400">Total Paid</p>
                    <p className="mt-0.5 text-lg font-black text-slate-900">
                      {formatNaira(data.totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-400">Total</p>
                    <p className="mt-0.5 text-lg font-black text-slate-900">
                      {formatNaira(data.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-400">Outstanding</p>
                    <p
                      className={`mt-0.5 text-lg font-black ${
                        outstanding > 0 ? "text-red-700" : "text-slate-400"
                      }`}
                    >
                      {formatNaira(outstanding)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-[10px] font-bold">
                    <span className="uppercase text-emerald-800">
                      {progressPct}% Completed
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-800 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                  Members
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {data.members.map((m) => {
                    const mBadge = STATUS_CONFIG[m.paymentStatus];
                    return (
                      <div
                        key={m.matricNumber}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div>
                          <p className="font-black text-slate-900">{m.fullName}</p>
                          <p className="font-mono text-xs text-slate-500">
                            {m.matricNumber}
                          </p>
                          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                            {m.email || "No email"}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${mBadge.cls}`}
                          >
                            {mBadge.label}
                          </span>
                          <p className="text-xs font-medium text-slate-500">
                            <span className="font-bold text-slate-700">
                              {formatNaira(m.totalPaid)}
                            </span>{" "}
                            paid ·{" "}
                            <span
                              className={`font-bold ${
                                (m.outstanding ?? 0) > 0
                                  ? "text-red-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              {formatNaira(
                                m.outstanding ?? Math.max(0, (m.share ?? 0) - m.totalPaid),
                              )}
                            </span>{" "}
                            left
                          </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {m.hasInvite && m.inviteUrl && (
                            <a
                              href={m.inviteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900 hover:underline"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                confirmation_number
                              </span>
                              View invite
                            </a>
                          )}
                          {m.studentId && (
                            <Link
                              href={`/admin/students/${m.studentId}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-900"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                open_in_new
                              </span>
                              Student detail
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payments */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">
                      receipt_long
                    </span>
                    Installment History
                  </h2>
                </div>

                {data.payments.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold text-slate-800">No payments yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Payments will appear here once processed.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/60">
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Reference
                          </th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.payments.map((p) => (
                          <tr
                            key={p._id}
                            className="transition-colors hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {formatNaira(p.amount)}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {p.reference}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  p.status?.toUpperCase() === "SUCCESS"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-rose-50 text-rose-800"
                                }`}
                              >
                                {capitalize(p.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {formatDateTime(p.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    router.push("/admin/auth");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-white">
          <span className="material-symbols-outlined text-[20px]">school</span>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-none tracking-tight text-slate-900">
            Admin Portal
          </h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            ULES FYW PAY
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:gap-8">
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-900"
            href="/admin/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-900"
            href="/admin/students"
          >
            Students
          </Link>
          <Link
            className="relative text-sm font-bold text-emerald-900 after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:bg-emerald-900 after:content-['']"
            href="/admin/groups"
          >
            Groups
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
