import StudentLogin from "@/components/pages/StudentLogin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ULES FYW PAY - Identify",
};

export default function Page() {
  return <StudentLogin />;
}
