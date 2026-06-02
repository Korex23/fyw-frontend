"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = "https://fyw-api.blessedbid.com";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type PaymentStatus = "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";

type StudentDoc = {
  _id: string;
  fullName: string;
  matricNumber: string;
  gender?: string;
  email?: string;
  phone?: string;
  department?: string;
  packageId?: { _id: string; code: string; name: string; price: number } | null;
  groupRegistrationId?: string | null;
  selectedDays?: string[];
  totalPaid: number;
  paymentStatus: PaymentStatus;
  invites?: { imageUrl?: string; generatedAt?: string } | null;
  createdAt?: string;
};

type PackageDoc = {
  _id: string;
  code: string;
  name: string;
  packageType: string;
  price: number;
  benefits: string[];
};

type Payment = {
  _id: string;
  amount: number;
  reference: string;
  status: string;
  paidAt: string;
};

type DetailData = {
  student: StudentDoc;
  package: PackageDoc;
  payments: Payment[];
  totalPaid: number;
  outstanding: number;
  effectivePrice?: number; // group member → their ₦54,000 share; else package price
};

type Toast = { id: number; message: string; type: "success" | "error" } | null;

type EditForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  department: string;
  matricNumber: string;
};

const MATRIC_REGEX = /^(1904|2104)\d{5}$/;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; cls: string }
> = {
  FULLY_PAID: { label: "Fully Paid", cls: "bg-emerald-50 text-emerald-800" },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    cls: "bg-amber-50 text-amber-800",
  },
  NOT_PAID: { label: "Not Paid", cls: "bg-rose-50 text-rose-800" },
};

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function AdminStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    department: "",
    matricNumber: "",
  });

  // Auth guard
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/admin/auth");
      return;
    }
    setToken(t);
  }, [router]);

  // Fetch student detail
  useEffect(() => {
    if (!token || !id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
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
          throw new Error(`Failed to load student: ${res.status} ${text}`);
        }

        const json = await res.json();
        setData(json.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [token, id, router]);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      const toastId = Date.now();
      setToast({ id: toastId, message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.id === toastId ? null : prev));
      }, 3000);
    },
    [],
  );

  const handleResendInvite = async () => {
    if (!token || resending) return;
    setResending(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/students/${id}/resend-invite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to resend invite");
      }
      showToast("Invite resent successfully", "success");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to resend invite", "error");
    } finally {
      setResending(false);
    }
  };

  const handleRegenerateInvite = async () => {
    if (!token || regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/students/${id}/regenerate-invite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to regenerate invite");
      }
      // Update local state with new image URL
      if (json.data?.imageUrl) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            student: {
              ...prev.student,
              invites: {
                ...prev.student.invites,
                imageUrl: json.data.imageUrl,
                generatedAt: new Date().toISOString(),
              },
            },
          };
        });
      }
      showToast("Invite regenerated and sent successfully", "success");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to regenerate invite", "error");
    } finally {
      setRegenerating(false);
    }
  };

  const openEdit = () => {
    if (!data) return;
    const s = data.student;
    setEditForm({
      fullName: s.fullName ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      gender: (s.gender ?? "").toLowerCase(),
      department: s.department ?? "",
      matricNumber: s.matricNumber ?? "",
    });
    setEditError(null);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!token || !data || saving) return;

    const s = data.student;
    // Send only changed, non-empty fields.
    const body: Record<string, string> = {};
    const trimmed: EditForm = {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      gender: editForm.gender.trim().toLowerCase(),
      department: editForm.department.trim(),
      matricNumber: editForm.matricNumber.trim(),
    };

    if (trimmed.fullName && trimmed.fullName !== s.fullName)
      body.fullName = trimmed.fullName;
    if (trimmed.email !== (s.email ?? "")) body.email = trimmed.email;
    if (trimmed.phone !== (s.phone ?? "")) body.phone = trimmed.phone;
    if (trimmed.gender && trimmed.gender !== (s.gender ?? "").toLowerCase())
      body.gender = trimmed.gender;
    if (trimmed.department !== (s.department ?? ""))
      body.department = trimmed.department;
    if (trimmed.matricNumber && trimmed.matricNumber !== s.matricNumber)
      body.matricNumber = trimmed.matricNumber;

    if (Object.keys(body).length === 0) {
      setEditError("No changes to save.");
      return;
    }
    if (body.matricNumber && !MATRIC_REGEX.test(body.matricNumber)) {
      setEditError("Matric number must match 1904XXXXX or 2104XXXXX.");
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        router.push("/admin/auth");
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to update student (${res.status})`);
      }

      const updated = json.data?.student as StudentDoc | undefined;
      if (updated) {
        setData((prev) => (prev ? { ...prev, student: updated } : prev));
      }
      setShowEdit(false);
      showToast("Student details updated", "success");
    } catch (e: any) {
      setEditError(e?.message ?? "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  if (token === null) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Edit Student</h2>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close edit form"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {editError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="space-y-4"
            >
              <EditField
                label="Full Name"
                value={editForm.fullName}
                onChange={(v) => setEditForm((p) => ({ ...p, fullName: v }))}
              />
              <EditField
                label="Matric Number"
                value={editForm.matricNumber}
                onChange={(v) => setEditForm((p) => ({ ...p, matricNumber: v }))}
                mono
                placeholder="1904XXXXX or 2104XXXXX"
              />
              <EditField
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(v) => setEditForm((p) => ({ ...p, email: v }))}
              />
              <EditField
                label="Phone"
                value={editForm.phone}
                onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))}
              />
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gender
                </label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, gender: e.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <EditField
                label="Department"
                value={editForm.department}
                onChange={(v) => setEditForm((p) => ({ ...p, department: v }))}
              />

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminHeader />

      <main className="px-4 py-8 md:px-10 lg:px-24">
        <div className="mx-auto max-w-[1100px]">
          {/* Back link */}
          <Link
            href="/admin/students"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-emerald-900"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Students
          </Link>

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-4 space-y-4 animate-pulse">
              <div className="h-48 rounded-xl bg-slate-200" />
              <div className="h-48 rounded-xl bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-200" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Content */}
          {!loading && data && (
            <div className="mt-4 space-y-6">
              {/* Page header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                    {data.student.fullName}
                  </h1>
                  <p className="mt-1 font-mono text-sm text-slate-500">
                    {data.student.matricNumber}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      STATUS_CONFIG[data.student.paymentStatus]?.cls ??
                      "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {STATUS_CONFIG[data.student.paymentStatus]?.label ??
                      data.student.paymentStatus}
                  </span>
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Student info card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">
                      person
                    </span>
                    Student Information
                  </h2>

                  <dl className="space-y-3">
                    <InfoRow
                      label="Full Name"
                      value={data.student.fullName}
                    />
                    <InfoRow
                      label="Matric Number"
                      value={data.student.matricNumber}
                      mono
                    />
                    <InfoRow
                      label="Gender"
                      value={capitalize(data.student.gender)}
                    />
                    <InfoRow
                      label="Email"
                      value={data.student.email || "Not provided"}
                      muted={!data.student.email}
                    />
                    <InfoRow
                      label="Phone"
                      value={data.student.phone || "Not provided"}
                      muted={!data.student.phone}
                    />
                    <InfoRow
                      label="Department"
                      value={data.student.department || "—"}
                    />
                    <InfoRow
                      label="Registered"
                      value={formatDate(data.student.createdAt)}
                    />
                  </dl>
                </div>

                {/* Package & payment card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">
                      package_2
                    </span>
                    Package & Payment
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Package
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">
                        {data.package?.name ?? data.student.packageId?.name ?? "—"}
                      </p>
                      {data.student.groupRegistrationId && (
                        <Link
                          href={`/admin/groups/${data.student.groupRegistrationId}`}
                          className="mt-1 inline-flex w-fit items-center gap-1 rounded border border-purple-100 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700 hover:bg-purple-100"
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            groups
                          </span>
                          Group member · view group
                        </Link>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        {data.student.groupRegistrationId
                          ? "Group Share"
                          : "Price"}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">
                        {formatNaira(
                          data.effectivePrice ??
                            data.package?.price ??
                            data.student.packageId?.price ??
                            0,
                        )}
                      </p>
                    </div>

                    {/* Selected days */}
                    {data.student.selectedDays &&
                      data.student.selectedDays.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-slate-400">
                            Selected Days
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.student.selectedDays.map((day) => (
                              <span
                                key={day}
                                className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800"
                              >
                                {DAY_LABELS[day] ?? day}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Total Paid
                        </p>
                        <p className="mt-0.5 text-lg font-black text-slate-900">
                          {formatNaira(data.totalPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Outstanding
                        </p>
                        <p
                          className={`mt-0.5 text-lg font-black ${
                            data.outstanding > 0
                              ? "text-red-700"
                              : "text-slate-400"
                          }`}
                        >
                          {formatNaira(data.outstanding)}
                        </p>
                      </div>
                    </div>

                    {/* Package benefits */}
                    {data.package?.benefits &&
                      data.package.benefits.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-slate-400">
                            Benefits
                          </p>
                          <ul className="space-y-1">
                            {data.package.benefits.map((b, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-slate-700"
                              >
                                <span className="material-symbols-outlined mt-0.5 text-[14px] text-emerald-600">
                                  check_small
                                </span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Payment history */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">
                      receipt_long
                    </span>
                    Payment History
                  </h2>
                </div>

                {data.payments.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      No payments yet
                    </p>
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
                                  p.status === "success"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-rose-50 text-rose-800"
                                }`}
                              >
                                {capitalize(p.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {formatDateTime(p.paidAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invite section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">
                    confirmation_number
                  </span>
                  Invite
                </h2>

                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  {/* Image preview */}
                  <div className="flex-1">
                    {data.student.invites?.imageUrl ? (
                      <div className="space-y-3">
                        <img
                          src={data.student.invites.imageUrl}
                          alt="Student invite"
                          className="max-w-[280px] rounded-lg border border-slate-200 shadow-sm"
                        />
                        {data.student.invites.generatedAt && (
                          <p className="text-xs text-slate-400">
                            Generated{" "}
                            {formatDateTime(data.student.invites.generatedAt)}
                          </p>
                        )}
                        <a
                          href={data.student.invites.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            open_in_new
                          </span>
                          View / Download
                        </a>
                      </div>
                    ) : (
                      <div className="flex h-32 w-full max-w-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-slate-300">
                            image
                          </span>
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            No invite generated yet
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3">
                    {data.student.invites?.imageUrl && data.student.email && (
                      <button
                        onClick={handleResendInvite}
                        disabled={resending || regenerating}
                        className="flex min-w-[180px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resending ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">
                              progress_activity
                            </span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">
                              send
                            </span>
                            Resend Invite
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleRegenerateInvite}
                      disabled={resending || regenerating}
                      className="flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {regenerating ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">
                            progress_activity
                          </span>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">
                            refresh
                          </span>
                          Regenerate Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50">
          <div
            className={`flex max-w-sm animate-in fade-in slide-in-from-bottom-4 items-center gap-3 rounded-xl border px-5 py-4 shadow-xl duration-300 ${
              toast.type === "success"
                ? "border-emerald-200 bg-white text-emerald-800"
                : "border-red-200 bg-white text-red-700"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Info Row ───────────────────────────────────────────────────────────────── */

function InfoRow(props: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <dt className="min-w-[100px] text-xs font-medium text-slate-400">
        {props.label}
      </dt>
      <dd
        className={`text-right text-sm font-semibold ${
          props.muted ? "text-slate-400" : "text-slate-800"
        } ${props.mono ? "font-mono" : ""}`}
      >
        {props.value}
      </dd>
    </div>
  );
}

/* ─── Edit Field ─────────────────────────────────────────────────────────────── */

function EditField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {props.label}
      </label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className={`h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 ${
          props.mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

/* ─── Admin Header ───────────────────────────────────────────────────────────── */

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
            className="relative text-sm font-bold text-emerald-900 after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:bg-emerald-900 after:content-['']"
            href="/admin/students"
          >
            Students
          </Link>
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-900"
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
