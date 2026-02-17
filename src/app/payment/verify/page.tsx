"use client";

import { Suspense } from "react";
import PaymentVerifyPage from "./Verify";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-10 text-slate-900">
      <Suspense>
        <PaymentVerifyPage />
      </Suspense>
    </div>
  );
}
