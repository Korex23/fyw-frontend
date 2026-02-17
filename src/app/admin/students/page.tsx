"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://fyw-api.atlascard.xyz";

type PaymentStatus = "NOT_PAID" | "PARTIALLY_PAID" | "FULLY_PAID";
type PackageCode = "A" | "B" | "C" | "D";

type PackageDoc = {
  _id: string;
  code: PackageCode;
  name: string;
  price: number;
  benefits: string[];
};

type StudentApi = {
  _id: string;
  matricNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  packageId?: PackageDoc | null; // backend returns populated object
  totalPaid: number;
  paymentStatus: PaymentStatus;
  invites?: {
    pdfUrl?: string;
    imageUrl?: string;
    generatedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

type StudentsResponse = {
  data: {
    students: StudentApi[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
};

type StudentRow = {
  _id: string;
  matricNumber: string;
  fullName: string;
  paymentStatus: PaymentStatus;
  totalPaid: number;
  outstanding: number;
  package?: { code: PackageCode; name: string } | null;
};

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusBadge(status: PaymentStatus) {
  if (status === "FULLY_PAID")
    return { label: "FULLY PAID", cls: "bg-emerald-50 text-emerald-800" };
  if (status === "PARTIALLY_PAID")
    return { label: "PARTIAL", cls: "bg-amber-50 text-amber-800" };
  return { label: "NOT PAID", cls: "bg-rose-50 text-rose-800" };
}

function packagePill(code?: string, name?: string) {
  if (!code || !name)
    return (
      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
        —
      </span>
    );

  const map: Record<string, string> = {
    A: "border-slate-200 bg-slate-50 text-slate-700",
    B: "border-blue-100 bg-blue-50 text-blue-700",
    C: "border-purple-100 bg-purple-50 text-purple-700",
    D: "border-purple-100 bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        map[code] ?? "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {name}
    </span>
  );
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: StudentRow[]) {
  const header = [
    "matricNumber",
    "fullName",
    "packageCode",
    "packageName",
    "paymentStatus",
    "totalPaid",
    "outstanding",
  ];

  const escape = (v: string) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };

  const lines = rows.map((r) => [
    r.matricNumber,
    r.fullName,
    r.package?.code ?? "",
    r.package?.name ?? "",
    r.paymentStatus,
    String(r.totalPaid ?? 0),
    String(r.outstanding ?? 0),
  ]);

  return [
    header.map(escape).join(","),
    ...lines.map((l) => l.map(escape).join(",")),
  ].join("\n");
}

export default function AdminStudentsPage() {
  const [token, setToken] = useState<string>("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | PaymentStatus>("ALL");
  const [packageCode, setPackageCode] = useState<"ALL" | PackageCode>("ALL");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchDebounced, setSearchDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (searchDebounced.trim()) qs.set("search", searchDebounced.trim());
    if (status !== "ALL") qs.set("status", status);
    if (packageCode !== "ALL") qs.set("packageCode", packageCode);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return qs.toString();
  }, [searchDebounced, status, packageCode, page]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);

      try {
        // if (!token) throw new Error("Missing admin token");
        const res = await fetch(
          `${API_BASE}/api/admin/students?${queryString}`,
          {
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed: ${res.status} ${res.statusText} ${text}`);
        }

        const json = (await res.json()) as StudentsResponse;

        console.log(json);

        const mapped: StudentRow[] = (json.data.students ?? []).map((s) => {
          const price = s.packageId?.price ?? 0;
          const paid = s.totalPaid ?? 0;
          const outstanding = Math.max(0, price - paid);

          return {
            _id: s._id,
            matricNumber: s.matricNumber,
            fullName: s.fullName,
            paymentStatus: s.paymentStatus,
            totalPaid: paid,
            outstanding,
            package: s.packageId
              ? { code: s.packageId.code, name: s.packageId.name }
              : null,
          };
        });

        console.log(mapped);

        setItems(mapped);
        setTotal(json.data.pagination?.total ?? mapped.length);
        setTotalPages(json.data.pagination?.pages ?? 1);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [queryString, token]);

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(total, page * limit);

  const onExportCSV = async () => {
    try {
      setExporting(true);
      const csv = toCSV(items);
      downloadTextFile(`students-${Date.now()}.csv`, csv);
    } finally {
      setExporting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] font-sans text-slate-800">
        <p className="text-sm text-slate-500">
          Unauthorized. Please{" "}
          <Link
            href="/admin/auth"
            className="text-emerald-900 font-bold hover:underline"
          >
            login
          </Link>{" "}
          to access the admin portal.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <AdminHeader exporting={exporting} onExport={onExportCSV} />

      <main className="flex-1 px-4 py-8 md:px-10 lg:px-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Student Payments
              </h1>
              <p className="text-base text-slate-500">
                Manage graduation package payments for University of Lagos
                Engineering Society Final Year Week.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>DB Synced</span>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <label className="relative flex w-full flex-col">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-emerald-800 focus:ring-2 focus:ring-emerald-900/10"
                    placeholder="Search by student name or matriculation number..."
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
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
                  <option value="PARTIALLY_PAID">Status: Partial</option>
                  <option value="NOT_PAID">Status: Not Paid</option>
                </select>

                <select
                  value={packageCode}
                  onChange={(e) => {
                    setPage(1);
                    setPackageCode(e.target.value as any);
                  }}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <option value="ALL">Package: All</option>
                  <option value="A">Package A</option>
                  <option value="B">Package B</option>
                  <option value="C">Package C</option>
                  <option value="D">Package D</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatus("ALL");
                    setPackageCode("ALL");
                    setPage(1);
                  }}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    filter_list
                  </span>
                  Reset
                </button>
              </div>
            </div>

            {/* {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )} */}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Matric Number
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Package
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Total Paid
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-900">
                      Outstanding
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
                          <div className="h-4 w-28 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-44 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-24 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-20 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-slate-100" />
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
                      <td colSpan={7} className="px-6 py-10 text-center">
                        <p className="text-sm font-bold text-slate-800">
                          No students found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try adjusting your search or filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const badge = statusBadge(row.paymentStatus);
                      return (
                        <tr
                          key={row._id}
                          className="transition-colors hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {row.matricNumber}
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            {row.fullName}
                          </td>

                          <td className="px-6 py-4 text-sm">
                            {packagePill(
                              row.package?.code,
                              (row.package?.name ?? "")
                                .replace(/\bpackage\b/gi, "")
                                .replace(/\s+/g, " ")
                                .trim(),
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {formatNaira(row.totalPaid)}
                          </td>

                          <td
                            className={`px-6 py-4 text-sm ${
                              row.outstanding > 0
                                ? "font-bold text-red-700"
                                : "text-slate-400"
                            }`}
                          >
                            {formatNaira(row.outstanding)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/students/${row._id}`}
                              className="text-sm font-bold text-emerald-900 hover:underline"
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
                of <span className="font-bold text-slate-900">{total}</span>{" "}
                records
              </p>

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
              />
            </div>
          </div>

          {exporting && (
            <div className="fixed bottom-8 right-8 z-50">
              <div className="max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-4 rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-6 shadow-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    Exporting data...
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    We’re generating your CSV file. It will download
                    automatically once ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  function AdminHeader(props: { exporting: boolean; onExport: () => void }) {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-white">
            <span className="material-symbols-outlined text-[20px]">
              school
            </span>
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
          </nav>

          <button
            onClick={() => {
              props.onExport();
            }}
            disabled={props.exporting}
            className="flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span>{props.exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </header>
    );
  }

  function Pagination(props: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
  }) {
    const { page, totalPages, onChange } = props;

    const pages = useMemo(() => {
      if (totalPages <= 7)
        return Array.from({ length: totalPages }, (_, i) => i + 1);

      const out: (number | "...")[] = [];
      out.push(1);
      if (page > 3) out.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let p = start; p <= end; p++) out.push(p);

      if (page < totalPages - 2) out.push("...");
      out.push(totalPages);

      return out;
    }, [page, totalPages]);

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
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

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-slate-300">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`flex h-9 w-9 items-center justify-center rounded border text-xs font-bold ${
                p === page
                  ? "border-emerald-900 bg-emerald-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`flex h-9 w-9 items-center justify-center rounded border ${
            page === totalPages
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    );
  }
}
