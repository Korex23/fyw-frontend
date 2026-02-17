"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "https://fyw-api.atlascard.xyz";

type VerifyResponse = {
  success: boolean;
  message?: string;
  data?: {
    rawGatewayPayload?: {
      meta?: {
        matricNumber?: string;
      };
    };
  } & Record<string, any>;
};

function firstParam(params: URLSearchParams, key: string) {
  const all = params.getAll(key).filter(Boolean);
  return all.length ? all[0] : null;
}

function extractMatricNumber(json: VerifyResponse): string | null {
  return json?.data?.matricNumber ?? null;
}

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference = useMemo(() => {
    return (
      firstParam(searchParams, "reference") ??
      firstParam(searchParams, "tx_ref") ??
      null
    );
  }, [searchParams]);

  const [status, setStatus] = useState<"verifying" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setError("Missing payment reference in URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/payments/verify?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Verify failed: ${res.status} ${res.statusText} ${text}`,
          );
        }

        const json = (await res.json()) as VerifyResponse;

        if (!json.success) {
          throw new Error(json.message ?? "Payment verification failed.");
        }

        const matricNumber = extractMatricNumber(json);

        if (!matricNumber) {
          throw new Error(
            "Payment verified, but matric number was not found in the response metadata.",
          );
        }

        router.replace(`/dashboard/${encodeURIComponent(matricNumber)}`);
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? "Something went wrong verifying payment.");
      }
    };

    verify();
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
            <span className="material-symbols-outlined">
              {status === "verifying" ? "progress_activity" : "error"}
            </span>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Payment Verification
            </p>
            <h1 className="text-xl font-black">
              {status === "verifying"
                ? "Verifying your payment..."
                : "Verification failed"}
            </h1>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Reference
          </p>
          <p className="mt-1 break-all font-mono text-sm text-slate-700">
            {reference ?? "—"}
          </p>
        </div>

        {status === "verifying" && (
          <p className="mt-4 text-sm font-medium text-slate-600">
            Please don’t close this page. You’ll be redirected automatically.
          </p>
        )}

        {status === "error" && (
          <>
            <p className="mt-4 text-sm font-medium text-red-700">{error}</p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Back to Login
              </Link>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl bg-[#2D6A4F] px-4 py-3 text-sm font-bold text-white hover:brightness-110"
              >
                Retry Verification
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
