"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "https://fyw-api.blessedbid.com";

type PaymentStatus = "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";

type GroupMember = {
  fullName: string;
  matricNumber: string;
  email?: string;
};

type GroupRow = {
  _id: string;
  payerEmail: string;
  members: GroupMember[];
  totalAmount: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  createdAt?: string;
};

type GroupsResponse = {
  data: {
    groups: GroupRow[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function statusBadge(status: PaymentStatus) {
  if (status === "FULLY_PAID")
    return { label: "FULLY PAID", cls: "bg-emerald-50 text-emerald-800" };
  if (status === "PARTIALLY_PAID")
    return { label: "PARTIAL", cls: "bg-amber-50 text-amber-800" };
  return { label: "NOT PAID", cls: "bg-rose-50 text-rose-800" };
}

export default function AdminGroupsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");

  const [status, setStatus] = useState<"ALL" | "FULLY_PAID" | "NOT_PAID">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<GroupRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (status !== "ALL") qs.set("status", status);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return qs.toString();
  }, [status, page]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/admin/auth");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/admin/groups?${queryString}`, {
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
          throw new Error(`Failed: ${res.status} ${res.statusText} ${text}`);
        }

        const json = (await res.json()) as GroupsResponse;
        setItems(json.data.groups ?? []);
        setTotal(json.data.pagination?.total ?? 0);
        setTotalPages(json.data.pagination?.pages ?? 1);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [queryString, token, router]);

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(total, page * limit);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <AdminHeader />

      <main className="flex-1 px-4 py-8 md:px-10 lg:px-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Groups
              </h1>
              <p className="text-base text-slate-500">
                Group registrations for the Full Experience bundle. New bundles are
                ₦162,000 (10% off ₦180,000); each row shows its own total.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>DB Synced</span>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as any);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <option value="ALL">Status: All</option>
              <option value="FULLY_PAID">Status: Fully Paid</option>
              <option value="NOT_PAID">Status: Not Paid</option>
            </select>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Payer Email
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Members
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Paid / Total
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-48 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-20 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="ml-auto h-4 w-16 rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center">
                        <p className="text-sm font-bold text-slate-800">
                          No groups found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try a different status filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const badge = statusBadge(row.paymentStatus);
                      return (
                        <tr
                          key={row._id}
                          className="cursor-pointer transition-colors hover:bg-slate-50/50"
                          onClick={() => router.push(`/admin/groups/${row._id}`)}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            {row.payerEmail}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {row.members.map((m) => (
                                <span
                                  key={m.matricNumber}
                                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                  title={m.email ?? ""}
                                >
                                  <span className="font-bold">{m.fullName}</span>
                                  <span className="font-mono text-slate-400">
                                    {m.matricNumber}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {formatNaira(row.totalPaid)}{" "}
                            <span className="font-medium text-slate-400">
                              / {formatNaira(row.totalAmount)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(row.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/groups/${row._id}`}
                              className="text-sm font-bold text-emerald-900 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-5">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="font-bold text-slate-900">{total}</span> groups
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`flex h-9 w-9 items-center justify-center rounded border ${
                    page === 1
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span className="px-3 text-sm font-bold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className={`flex h-9 w-9 items-center justify-center rounded border ${
                    page >= totalPages
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
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
