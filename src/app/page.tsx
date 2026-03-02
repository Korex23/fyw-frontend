import { Suspense } from "react";
import StudentRegister from "@/components/pages/StudentRegister";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Register",
};

export default function Page() {
  return (
    <Suspense>
      <StudentRegister />
    </Suspense>
  );
}
